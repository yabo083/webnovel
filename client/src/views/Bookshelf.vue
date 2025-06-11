<template>
  <div class="bookshelf-container">
    <div class="header">
      <div class="header-left">
        <h1>我的书架</h1>
        <p>共 {{ novels.length }} 本小说</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建新书
        </el-button>
        <el-button @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </div>
    </div>

    <div class="novels-grid" v-if="novels.length > 0">
      <div 
        v-for="novel in novels" 
        :key="novel.id"
        class="novel-card"
        @click="goToNovel(novel.id)"
      >
        <div class="novel-cover">
          {{ novel.title.charAt(0) }}
        </div>
        <div class="novel-info">
          <h3 class="novel-title">{{ novel.title }}</h3>
          <p class="novel-description">{{ novel.description || '暂无简介' }}</p>
          <div class="novel-stats">
            <span>{{ novel.chapter_count }} 章</span>
            <span>{{ formatWords(novel.total_words) }} 字</span>
            <span>{{ formatDate(novel.last_updated) }}</span>
          </div>
        </div>
        <div class="novel-actions" @click.stop>
          <el-dropdown>
            <el-button text>
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="editNovel(novel)">编辑</el-dropdown-item>
                <el-dropdown-item @click="deleteNovel(novel)" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="还没有小说，开始创作第一本吧！">
        <el-button type="primary" @click="showCreateDialog = true">
          创建新书
        </el-button>
      </el-empty>
    </div>

    <!-- 创建/编辑小说对话框 -->
    <el-dialog 
      :title="editingNovel ? '编辑小说' : '创建新书'"
      v-model="showCreateDialog"
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
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateNovel" :loading="creating">
          {{ editingNovel ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import api from '../utils/api'

const router = useRouter()
const authStore = useAuthStore()

const novels = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const creating = ref(false)
const editingNovel = ref(null)
const novelFormRef = ref()

const novelForm = reactive({
  title: '',
  description: '',
  category: '其他'
})

const novelRules = {
  title: [
    { required: true, message: '请输入小说标题', trigger: 'blur' }
  ]
}

const fetchNovels = async () => {
  loading.value = true
  try {
    const response = await api.get('/novels')
    novels.value = response.novels
  } catch (error) {
    console.error('Fetch novels error:', error)
  } finally {
    loading.value = false
  }
}

const goToNovel = (novelId) => {
  router.push(`/novel/${novelId}`)
}

const handleCreateNovel = async () => {
  const valid = await novelFormRef.value.validate().catch(() => false)
  if (!valid) return

  creating.value = true
  try {
    if (editingNovel.value) {
      await api.put(`/novels/${editingNovel.value.id}`, novelForm)
      ElMessage.success('小说更新成功！')
    } else {
      await api.post('/novels', novelForm)
      ElMessage.success('小说创建成功！')
    }
    
    showCreateDialog.value = false
    resetForm()
    fetchNovels()
  } catch (error) {
    console.error('Create/Update novel error:', error)
  } finally {
    creating.value = false
  }
}

const editNovel = (novel) => {
  editingNovel.value = novel
  novelForm.title = novel.title
  novelForm.description = novel.description
  novelForm.category = novel.category
  showCreateDialog.value = true
}

const deleteNovel = async (novel) => {
  try {
    await ElMessageBox.confirm(`确定要删除小说《${novel.title}》吗？`, '确认删除', {
      type: 'warning'
    })
    
    await api.delete(`/novels/${novel.id}`)
    ElMessage.success('小说删除成功！')
    fetchNovels()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete novel error:', error)
    }
  }
}

const resetForm = () => {
  editingNovel.value = null
  novelForm.title = ''
  novelForm.description = ''
  novelForm.category = '其他'
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const formatWords = (count) => {
  if (count < 1000) return `${count}`
  if (count < 10000) return `${(count / 1000).toFixed(1)}千`
  return `${(count / 10000).toFixed(1)}万`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchNovels()
})
</script>

<style scoped>
.bookshelf-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;
}

.header h1 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 5px;
}

.header p {
  color: #909399;
  font-size: 16px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.novel-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.novel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.novel-cover {
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  font-weight: bold;
}

.novel-info {
  padding: 20px;
}

.novel-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.novel-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.novel-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.novel-actions {
  position: absolute;
  top: 12px;
  right: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .novels-grid {
    grid-template-columns: 1fr;
  }
}
</style> 