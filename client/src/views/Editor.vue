<template>
  <div class="editor-container">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-button @click="$router.back()" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回目录
        </el-button>
        <div class="chapter-info" v-if="chapter">
          <span class="novel-title">{{ chapter.novel?.title }}</span>
          <span class="chapter-title">{{ chapter.title }}</span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <div class="word-count">
          字数：{{ wordCount }}
        </div>
        <div class="save-status" :class="saveStatus">
          {{ saveStatusText }}
        </div>
        <el-popover placement="bottom" :width="300" trigger="hover">
          <template #reference>
            <el-button text>
              <el-icon><InfoFilled /></el-icon>
              编辑技巧
            </el-button>
          </template>
          <div class="editor-tips">
            <div class="tip-item">
              <strong>Ctrl + S</strong> - 保存文档
            </div>
            <div class="tip-item">
              <strong>Ctrl + Enter</strong> - 一键全文排版
            </div>
          </div>
        </el-popover>
        <el-popover placement="bottom" :width="250" trigger="click">
          <template #reference>
            <el-button>
              <el-icon><Setting /></el-icon>
              排版设置
            </el-button>
          </template>
          <div class="formatting-settings">
            <div class="setting-title">一键排版设置 (Ctrl+Enter)</div>
            <el-checkbox v-model="isIndentEnabled" class="setting-item">
              首行缩进
            </el-checkbox>
            <el-checkbox v-model="isBlankLineEnabled" class="setting-item">
              段间空行
            </el-checkbox>
          </div>
        </el-popover>
        <el-button @click="handleSave" :loading="saving">
          <el-icon><DocumentCopy /></el-icon>
          保存
        </el-button>
        <el-button type="primary" @click="handleComplete" :loading="completing">
          <el-icon><CircleCheck /></el-icon>
          {{ chapter?.status === '已完结' ? '标记完结' : '标记完结' }}
        </el-button>
      </div>
    </div>

    <div class="editor-content" v-if="chapter">
      <el-input
        v-model="chapterTitle"
        placeholder="章节标题"
        class="editor-title-input"
        size="large"
        @input="onTitleChange"
      />
      
      <textarea
        v-model="content"
        class="editor-text-area"
        placeholder="开始您的创作..."
        @input="onContentChange"
        @keydown="handleTextareaKeydown"
        ref="textareaRef"
      />
    </div>

    <div v-else class="loading-state" v-loading="true">
      <div>加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled, CircleCheck, Setting } from '@element-plus/icons-vue'
import { debounce } from 'lodash'
import api from '../utils/api'

const route = useRoute()
const router = useRouter()

const chapter = ref(null)
const chapterTitle = ref('')
const content = ref('')
const textareaRef = ref()
const saving = ref(false)
const completing = ref(false)
const saveStatus = ref('saved')
const lastSavedContent = ref('')
const hasUnsavedChanges = ref(false)

// 排版设置
const isIndentEnabled = ref(true)  // 默认启用首行缩进
const isBlankLineEnabled = ref(true)  // 默认启用段间空行

// 计算字数
const wordCount = computed(() => {
  if (!content.value) return 0
  return content.value.replace(/\s/g, '').length
})

// 保存状态文本
const saveStatusText = computed(() => {
  switch (saveStatus.value) {
    case 'saving':
      return '保存中...'
    case 'saved':
      return hasUnsavedChanges.value ? '有未保存的更改' : '已保存'
    case 'error':
      return '保存失败'
    default:
      return '已保存'
  }
})

// 获取章节详情
const fetchChapter = async () => {
  try {
    const response = await api.get(`/chapters/${route.params.chapterId}`)
    chapter.value = response.chapter
    chapterTitle.value = chapter.value.title
    content.value = chapter.value.content || ''
    lastSavedContent.value = content.value
    
    // 聚焦到编辑器
    await nextTick()
    textareaRef.value?.focus()
  } catch (error) {
    console.error('Fetch chapter error:', error)
    ElMessage.error('获取章节内容失败')
    router.back()
  }
}

// 自动保存函数
const autoSave = debounce(async () => {
  if (!hasUnsavedChanges.value || saving.value) return
  
  saveStatus.value = 'saving'
  try {
    await api.put(`/chapters/${route.params.chapterId}/autosave`, {
      content: content.value
    })
    
    lastSavedContent.value = content.value
    hasUnsavedChanges.value = false
    saveStatus.value = 'saved'
  } catch (error) {
    console.error('Auto save error:', error)
    saveStatus.value = 'error'
  }
}, 2000) // 2秒防抖

// 内容变化处理
const onContentChange = () => {
  hasUnsavedChanges.value = content.value !== lastSavedContent.value
  if (hasUnsavedChanges.value) {
    autoSave()
  }
}

// 标题变化处理
const onTitleChange = debounce(async () => {
  if (chapterTitle.value === chapter.value.title) return
  
  try {
    await api.put(`/chapters/${route.params.chapterId}`, {
      title: chapterTitle.value
    })
    chapter.value.title = chapterTitle.value
  } catch (error) {
    console.error('Update title error:', error)
  }
}, 1000)

// 手动保存
const handleSave = async () => {
  if (!hasUnsavedChanges.value) return
  
  saving.value = true
  try {
    await api.put(`/chapters/${route.params.chapterId}`, {
      title: chapterTitle.value,
      content: content.value
    })
    
    lastSavedContent.value = content.value
    hasUnsavedChanges.value = false
    saveStatus.value = 'saved'
    ElMessage.success('保存成功！')
  } catch (error) {
    console.error('Save error:', error)
    saveStatus.value = 'error'
  } finally {
    saving.value = false
  }
}

// 标记章节完结
const handleComplete = async () => {
  // 先保存
  if (hasUnsavedChanges.value) {
    await handleSave()
  }
  
  completing.value = true
  try {
    await api.put(`/chapters/${route.params.chapterId}`, {
      title: chapterTitle.value,
      content: content.value,
      status: '已完结'
    })
    
    chapter.value.status = '已完结'
    ElMessage.success('章节已标记为完结！')
  } catch (error) {
    console.error('Complete error:', error)
    ElMessage.error('标记完结失败')
  } finally {
    completing.value = false
  }
}

// 键盘快捷键
const handleKeydown = (event) => {
  // Ctrl+S 保存
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    handleSave()
  }
}

// 文本区域键盘事件处理（仅保留Ctrl+Enter全文排版）
const handleTextareaKeydown = (event) => {
  // 只处理 Ctrl+Enter 一键全文排版
  if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault()
    
    const textarea = event.target
    const { value } = textarea
    
    // Ctrl+Enter: 一键全文排版
    const formattedText = reformatFullText(value, isIndentEnabled.value, isBlankLineEnabled.value)
    content.value = formattedText
    
    // 触发内容变化
    onContentChange()
    
    // 显示成功提示
    ElMessage.success('全文排版完成！')
    
    // 将光标移到文本末尾
    nextTick(() => {
      textarea.selectionStart = formattedText.length
      textarea.selectionEnd = formattedText.length
      textarea.focus()
    })
  }
}

// 一键全文排版功能
const reformatFullText = (rawText, isIndentEnabled, isBlankLineEnabled) => {
  // 步骤 1: 文本预处理与分段
  // a. 标准化换行符
  let cleanedText = rawText.replace(/\r\n/g, '\n')
  
  // b. 切分段落 (使用正则表达式切分连续换行符)
  let paragraphsArray = cleanedText.split(/\n+/).filter(p => p.trim() !== '')
  
  let processedParagraphs = []
  
  for (let paragraph of paragraphsArray) {
    // c. 清除段首空白 (移除行首已存在的任何空白字符)
    let trimmedParagraph = paragraph.replace(/^[\s　]+/gm, '') // 清除全角半角空格和制表符
    
    // 步骤 2: 应用"首行缩进"
    if (isIndentEnabled) {
      trimmedParagraph = '　　' + trimmedParagraph // 使用全角空格缩进
    }
    
    processedParagraphs.push(trimmedParagraph)
  }
  
  // 步骤 3: 应用"段间空行"并组合全文
  let separator = isBlankLineEnabled ? '\n\n' : '\n'
  let formattedText = processedParagraphs.join(separator)
  
  return formattedText
}

// 页面离开前确认
const handleBeforeUnload = (event) => {
  if (hasUnsavedChanges.value) {
    event.preventDefault()
    event.returnValue = '您有未保存的更改，确定要离开吗？'
    return event.returnValue
  }
}

onMounted(() => {
  fetchChapter()
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  
  // 清除防抖函数
  autoSave.cancel()
})
</script>

<style scoped>
.editor-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.editor-toolbar {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chapter-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.novel-title {
  font-size: 14px;
  color: #909399;
}

.chapter-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.word-count {
  font-size: 14px;
  color: #909399;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

.save-status {
  font-size: 14px;
  font-weight: 500;
}

.save-status.saved {
  color: #67c23a;
}

.save-status.saving {
  color: #e6a23c;
}

.save-status.error {
  color: #f56c6c;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 20px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.editor-title-input {
  margin-bottom: 16px;
}

.editor-title-input :deep(.el-input__inner) {
  font-size: 20px;
  font-weight: 600;
  border: none;
  box-shadow: none;
}

.editor-text-area {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 2;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: transparent;
}

.editor-text-area::placeholder {
  color: #c0c4cc;
}

.editor-tips {
  padding: 8px 0;
}

.tip-item {
  padding: 4px 0;
  font-size: 14px;
  color: #606266;
}

.tip-item strong {
  color: #303133;
  font-weight: 600;
}

.formatting-settings {
  padding: 8px 0;
}

.setting-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.setting-item {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .editor-content {
    margin: 10px;
    padding: 16px;
  }
  
  .word-count {
    order: -1;
  }
}
</style> 