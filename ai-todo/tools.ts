import { PrismaClient, type Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export type TodoInput = {
  title: string
  completed?: boolean
  completed_at?: Date | null
}

export const getAllTodos = async (
  filter?: { completed?: boolean },
  skip?: number,
  take?: number,
) => {
  try {
    return await prisma.todo.findMany({
      where: filter,
      skip,
      take,
    })
  } catch (error) {
    console.error('Error fetching todos:', error)
    throw error
  }
}

export const getTodoById = async (id: string) => {
  try {
    const todo = await prisma.todo.findUnique({
      where: { id },
    })
    if (!todo) throw new Error(`Todo with ID ${id} not found`)
    return todo
  } catch (error) {
    console.error('Error fetching todo:', error)
    throw error
  }
}

export const createTodo = async (data: TodoInput) => {
  try {
    const todo = await prisma.todo.create({
      data: {
        ...data,
        completed_at: data.completed ? new Date() : null,
      },
    })

    return todo.id
  } catch (error) {
    console.error('Error creating todo:', error)
    throw error
  }
}

export const updateTodo = async (id: string, data: Partial<TodoInput>) => {
  try {
    const updatedData = {
      ...data,
      completed_at: data.completed ? new Date() : null,
    }
    return await prisma.todo.update({
      where: { id },
      data: updatedData,
    })
  } catch (error) {
    console.error('Error updating todo:', error)
    throw error
  }
}

export const deleteTodo = async (id: string) => {
  try {
    return await prisma.todo.delete({
      where: { id },
    })
  } catch (error) {
    console.error('Error deleting todo:', error)
    throw error
  }
}

export const toggleTodoCompletion = async (id: string) => {
  try {
    const todo = await prisma.todo.findUnique({ where: { id } })
    if (!todo) throw new Error(`Todo with ID ${id} not found`)

    return await prisma.todo.update({
      where: { id },
      data: {
        completed: !todo.completed,
        completed_at: todo.completed ? null : new Date(),
      },
    })
  } catch (error) {
    console.error('Error toggling todo completion:', error)
    throw error
  }
}

export const getTodosCount = async (filter?: { completed?: boolean }) => {
  try {
    return await prisma.todo.count({
      where: filter,
    })
  } catch (error) {
    console.error('Error counting todos:', error)
    throw error
  }
}

export const bulkCreateTodos = async (todos: TodoInput[]) => {
  try {
    return await prisma.$transaction(
      todos.map((todo) =>
        prisma.todo.create({
          data: {
            ...todo,
            completed_at: todo.completed ? new Date() : null,
          },
        })
      )
    )
  } catch (error) {
    console.error('Error bulk creating todos:', error)
    throw error
  }
}

export const deleteCompletedTodos = async () => {
  try {
    return await prisma.todo.deleteMany({
      where: { completed: true },
    })
  } catch (error) {
    console.error('Error deleting completed todos:', error)
    throw error
  }
}

export const searchTodosByTitle = async (searchTerm: string) => {
  try {
    return await prisma.todo.findMany({
      where: {
        title: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
    })
  } catch (error) {
    console.error('Error searching todos:', error)
    throw error
  }
}

export const getTodosCompletedInRange = async (
  startDate: Date,
  endDate: Date
) => {
  try {
    return await prisma.todo.findMany({
      where: {
        completed: true,
        completed_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching todos completed in range:', error)
    throw error
  }
}

export const getTodosCreatedInRange = async (
  startDate: Date,
  endDate: Date
) => {
  try {
    return await prisma.todo.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching todos created in range:', error)
    throw error
  }
}

export const getTodosUpdatedAfter = async (date: Date) => {
  try {
    return await prisma.todo.findMany({
      where: {
        updated_at: {
          gt: date,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching todos updated after date:', error)
    throw error
  }
}
