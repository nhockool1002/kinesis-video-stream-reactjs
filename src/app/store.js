import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import listSignalReducer from 'feature/listSignalSlice'

const rootReducer = {
  listSignal: listSignalReducer
}

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['listSignal/addList']
    }
  })
})

export default store
