import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@desktop/views/Home.vue'
import BookDetail from '@desktop/views/BookDetail.vue'
import BookEdit from '@desktop/views/BookEdit.vue'
import NotesList from '@desktop/views/NotesList.vue'
import CategoriesManage from '@desktop/views/CategoriesManage.vue'
import TagsManage from '@desktop/views/TagsManage.vue'
import SearchResult from '@desktop/views/SearchResult.vue'
import FeedbackView from '@desktop/views/FeedbackView.vue'
import ThemeSettings from '@desktop/views/ThemeSettings.vue'
import ImportExport from '@desktop/views/ImportExport.vue'
import MoreView from '../views/MoreView.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/books/new', name: 'BookNew', component: BookEdit },
  { path: '/books/:id', name: 'BookDetail', component: BookDetail },
  { path: '/books/:id/edit', name: 'BookEdit', component: BookEdit },
  { path: '/notes', name: 'Notes', component: NotesList },
  { path: '/categories', name: 'Categories', component: CategoriesManage },
  { path: '/tags', name: 'Tags', component: TagsManage },
  { path: '/search', name: 'Search', component: SearchResult },
  { path: '/feedback', name: 'Feedback', component: FeedbackView },
  { path: '/theme', name: 'Theme', component: ThemeSettings },
  { path: '/import-export', name: 'ImportExport', component: ImportExport },
  { path: '/more', name: 'More', component: MoreView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
