<template>
  <div class="novel-detail-container">
    <div class="header">
      <el-button @click="$router.back()" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="novel-info" v-if="novel">
        <h1>{{ novel.title }}</h1>
        <p class="novel-description" v-if="novel.description">
          {{ novel.description }}
        </p>
        <p class="novel-description empty" v-else>
          暂无简介，点击"编辑小说"可以添加简介
        </p>
        <div class="novel-stats">
          <span>{{ chapters.length }} 章</span>
          <span>{{ formatWords(novel.total_words) }} 字</span>
          <span>分类：{{ novel.category || '其他' }}</span>
          <span>最后更新：{{ formatDate(novel.last_updated) }}</span>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="showEditNovelDialog = true" v-if="novel">
          <el-icon><Edit /></el-icon>
          编辑小说
        </el-button>
        <el-button type="primary" @click="showCreateChapterDialog = true">
          <el-icon><Plus /></el-icon>
          新建章节
        </el-button>
      </div>
    </div>

    <div class="content">
      <div class="chapters-list" v-if="chapters.length > 0">
        <div 
          v-for="(chapter, index) in chapters" 
          :key="chapter.id"
          class="chapter-item"
          @click="goToEditor(chapter.id)"
        >
          <div class="chapter-info">
            <div class="chapter-title">
              第{{ index + 1 }}章 {{ chapter.title }}
            </div>
            <div class="chapter-meta">
              <span class="word-count">{{ formatWords(chapter.word_count) }} 字</span>
              <span class="status" :class="chapter.status">{{ chapter.status }}</span>
              <span class="update-time">{{ formatDate(chapter.updated_at) }}</span>
            </div>
          </div>
          <div class="chapter-actions" @click.stop>
            <el-dropdown>
              <el-button text>
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="editChapter(chapter)">编辑</el-dropdown-item>
                  <el-dropdown-item @click="deleteChapter(chapter)" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <el-empty description="还没有章节，开始创作第一章吧！">
          <el-button type="primary" @click="showCreateChapterDialog = true">
            新建章节
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 编辑小说对话框 -->
    <el-dialog 
      title="编辑小说信息"
      v-model="showEditNovelDialog"
      width="500px"
    >
      <el-form :model="novelForm" :rules="novelRules" ref="novelFormRef">
        <el-form-item label="小说标题" prop="title">
          <el-input v-model="novelForm.title" placeholder="请输入小说标题" />
        </el-form-item>
        <el-form-item label="小说简介" prop="description">
          <el-input 
            v-model="novelForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请输入小说简介（可选）"
          />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="novelForm.category" placeholder="请选择分类">
            <el-option label="玄幻" value="玄幻" />
            <el-option label="言情" value="言情" />
            <el-option label="都市" value="都市" />
            <el-option label="历史" value="历史" />
            <el-option label="科幻" value="科幻" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditNovelDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateNovel" :loading="updating">
          更新
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑章节对话框 -->
    <el-dialog 
      :title="editingChapter ? '编辑章节' : '新建章节'"
      v-model="showCreateChapterDialog"
      width="500px"
    >
      <el-form :model="chapterForm" :rules="chapterRules" ref="chapterFormRef">
        <el-form-item label="章节标题" prop="title">
          <el-input v-model="chapterForm.title" placeholder="请输入章节标题" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateChapterDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateChapter" :loading="creating">
          {{ editingChapter ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import api from '../utils/api'

const route = useRoute()
const router = useRouter()

const novel = ref(null)
const chapters = ref([])
const loading = ref(false)
const showCreateChapterDialog = ref(false)
const showEditNovelDialog = ref(false)
const creating = ref(false)
const updating = ref(false)
const editingChapter = ref(null)
const chapterFormRef = ref()
const novelFormRef = ref()

const chapterForm = reactive({
  title: ''
})

const novelForm = reactive({
  title: '',
  description: '',
  category: '其他'
})

const chapterRules = {
  title: [
    { required: true, message: '请输入章节标题', trigger: 'blur' }
  ]
}

const novelRules = {
  title: [
    { required: true, message: '请输入小说标题', trigger: 'blur' }
  ]
}

const fetchChapters = async () => {
  loading.value = true
  try {
    const response = await api.get(`/novels/${route.params.id}/chapters`)
    novel.value = response.novel
    chapters.value = response.chapters
    
    // 同时获取完整的小说信息
    const novelResponse = await api.get(`/novels/${route.params.id}`)
    novel.value = { ...novel.value, ...novelResponse.novel }
    
    // 填充编辑表单
    novelForm.title = novel.value.title || ''
    novelForm.description = novel.value.description || ''
    novelForm.category = novel.value.category || '其他'
  } catch (error) {
    console.error('Fetch chapters error:', error)
  } finally {
    loading.value = false
  }
}

const goToEditor = (chapterId) => {
  router.push(`/editor/${chapterId}`)
}

const handleCreateChapter = async () => {
  const valid = await chapterFormRef.value.validate().catch(() => false)
  if (!valid) return

  creating.value = true
  try {
    if (editingChapter.value) {
      await api.put(`/chapters/${editingChapter.value.id}`, chapterForm)
      ElMessage.success('章节更新成功！')
    } else {
      await api.post('/chapters', {
        ...chapterForm,
        novel_id: route.params.id
      })
      ElMessage.success('章节创建成功！')
    }
    
    showCreateChapterDialog.value = false
    resetForm()
    fetchChapters()
  } catch (error) {
    console.error('Create/Update chapter error:', error)
  } finally {
    creating.value = false
  }
}

const editChapter = (chapter) => {
  editingChapter.value = chapter
  chapterForm.title = chapter.title
  showCreateChapterDialog.value = true
}

const deleteChapter = async (chapter) => {
  try {
    await ElMessageBox.confirm(`确定要删除章节《${chapter.title}》吗？`, '确认删除', {
      type: 'warning'
    })
    
    await api.delete(`/chapters/${chapter.id}`)
    ElMessage.success('章节删除成功！')
    fetchChapters()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete chapter error:', error)
    }
  }
}

const resetForm = () => {
  editingChapter.value = null
  chapterForm.title = ''
}

// 更新小说信息
const handleUpdateNovel = async () => {
  const valid = await novelFormRef.value.validate().catch(() => false)
  if (!valid) return

  updating.value = true
  try {
    await api.put(`/novels/${route.params.id}`, novelForm)
    
    // 更新本地数据
    novel.value.title = novelForm.title
    novel.value.description = novelForm.description
    novel.value.category = novelForm.category
    
    showEditNovelDialog.value = false
    ElMessage.success('小说信息更新成功！')
  } catch (error) {
    console.error('Update novel error:', error)
    ElMessage.error('更新失败，请重试')
  } finally {
    updating.value = false
  }
}

const formatWords = (count) => {
  if (count < 1000) return `${count}`
  if (count < 10000) return `${(count / 1000).toFixed(1)}千`
  return `${(count / 10000).toFixed(1)}万`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchChapters()
})
</script>

<style scoped>
.novel-detail-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.back-button {
  flex-shrink: 0;
}

.novel-info {
  flex: 1;
}

.novel-info h1 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
}

.novel-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
  padding: 8px 0;
}

.novel-description.empty {
  color: #c0c4cc;
  font-style: italic;
}

.novel-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #909399;
  flex-wrap: wrap;
}

.content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chapters-list {
  max-height: 70vh;
  overflow-y: auto;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chapter-item:hover {
  background-color: #f8f9fa;
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-info {
  flex: 1;
}

.chapter-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #909399;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.草稿 {
  background-color: #f0f0f0;
  color: #606266;
}

.status.已完结 {
  background-color: #e8f5e8;
  color: #67c23a;
}

.chapter-actions {
  flex-shrink: 0;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
  }
  
  .novel-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .chapter-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style> 