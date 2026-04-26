import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import BookDetail from '../views/BookDetail.vue'
import BookEdit from '../views/BookEdit.vue'
import NotesList from '../views/NotesList.vue'
import CategoriesManage from '../views/CategoriesManage.vue'
import TagsManage from '../views/TagsManage.vue'
import SearchResult from '../views/SearchResult.vue'
import FeedbackView from '../views/FeedbackView.vue'
import ThemeSettings from '../views/ThemeSettings.vue'
import ImportExport from '../views/ImportExport.vue'

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
  { path: '/import-export', name: 'ImportExport', component: ImportExport }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
