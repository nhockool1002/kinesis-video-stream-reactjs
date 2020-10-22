import { createSlice } from '@reduxjs/toolkit'

const initList = []

const listSignal = createSlice({
  name: 'listSignal',
  initialState: initList,
  reducers: {
    addList: (state, action) => {
      let newList = [...state]
      newList = action.payload
      return newList
    }
  }
})

const { reducer, actions } = listSignal

export const { addList } = actions

export default reducer
