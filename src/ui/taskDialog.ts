import type { Task, TaskPriority } from '../models/task.ts'
import type { TaskDetails } from '../tasks/taskOperations.ts'
import { dateTimeLocalToIso, isoToDateTimeLocal } from '../utils/dateTime.ts'

type TaskDialogSubmission = {
  taskId: string | null
  details: TaskDetails
}

export type TaskDialogController = {
  openForCreate: (opener: HTMLElement) => void
  openForEdit: (task: Task, opener: HTMLElement) => void
}

export function createTaskDialog(
  onSubmit: (submission: TaskDialogSubmission) => void,
): TaskDialogController {
  const dialog = document.createElement('dialog')
  dialog.className = 'task-dialog'
  dialog.setAttribute('aria-labelledby', 'task-dialog-title')
  dialog.innerHTML = `
    <div class="dialog-card">
      <div class="dialog-header">
        <div>
          <p class="dialog-eyebrow" id="task-dialog-eyebrow">New task</p>
          <h2 id="task-dialog-title">Add a task</h2>
        </div>
        <button class="dialog-close" type="button" aria-label="Close task form">×</button>
      </div>

      <form class="dialog-form" id="task-dialog-form">
        <div class="field-stack">
          <label for="dialog-task-title">Task title</label>
          <input
            id="dialog-task-title"
            name="title"
            type="text"
            placeholder="What needs to be done?"
            maxlength="200"
            autocomplete="off"
            required
          />
        </div>

        <div class="field-stack">
          <label for="dialog-task-description">Description <span>(optional)</span></label>
          <textarea
            id="dialog-task-description"
            name="description"
            placeholder="Add useful details or context"
            maxlength="1000"
            rows="4"
          ></textarea>
        </div>

        <div class="dialog-options">
          <div class="field-stack">
            <label for="dialog-task-due-at">Due date and time <span>(optional)</span></label>
            <input id="dialog-task-due-at" name="dueAt" type="datetime-local" />
          </div>

          <div class="field-stack">
            <label for="dialog-task-priority">Priority</label>
            <select id="dialog-task-priority" name="priority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="small-button small-button--secondary dialog-cancel" type="button">Cancel</button>
          <button class="small-button dialog-submit" type="submit">Add task</button>
        </div>
      </form>
    </div>
  `
  document.body.append(dialog)

  const form = dialog.querySelector<HTMLFormElement>('#task-dialog-form')!
  const eyebrow = dialog.querySelector<HTMLParagraphElement>('#task-dialog-eyebrow')!
  const heading = dialog.querySelector<HTMLHeadingElement>('#task-dialog-title')!
  const titleInput = dialog.querySelector<HTMLInputElement>('#dialog-task-title')!
  const descriptionInput = dialog.querySelector<HTMLTextAreaElement>('#dialog-task-description')!
  const dueAtInput = dialog.querySelector<HTMLInputElement>('#dialog-task-due-at')!
  const priorityInput = dialog.querySelector<HTMLSelectElement>('#dialog-task-priority')!
  const submitButton = dialog.querySelector<HTMLButtonElement>('.dialog-submit')!
  const cancelButton = dialog.querySelector<HTMLButtonElement>('.dialog-cancel')!
  const closeButton = dialog.querySelector<HTMLButtonElement>('.dialog-close')!

  let editingTaskId: string | null = null
  let returnFocusTo: HTMLElement | null = null
  let returnTaskId: string | null = null

  function prepareDialog(task: Task | null, opener: HTMLElement): void {
    form.reset()
    editingTaskId = task?.id ?? null
    returnFocusTo = opener
    returnTaskId = task?.id ?? null

    if (task === null) {
      eyebrow.textContent = 'New task'
      heading.textContent = 'Add a task'
      submitButton.textContent = 'Add task'
    } else {
      eyebrow.textContent = 'Task details'
      heading.textContent = 'Edit task'
      submitButton.textContent = 'Save changes'
      titleInput.value = task.title
      descriptionInput.value = task.description
      dueAtInput.value = isoToDateTimeLocal(task.dueAt)
      priorityInput.value = task.priority
    }

    dialog.showModal()
    titleInput.focus()
    titleInput.select()
  }

  function closeDialog(): void {
    dialog.close()
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const title = titleInput.value.trim()

    if (title === '') {
      titleInput.focus()
      return
    }

    onSubmit({
      taskId: editingTaskId,
      details: {
        title,
        description: descriptionInput.value,
        dueAt: dateTimeLocalToIso(dueAtInput.value),
        priority: priorityInput.value as TaskPriority,
      },
    })
    closeDialog()
  })

  cancelButton.addEventListener('click', closeDialog)
  closeButton.addEventListener('click', closeDialog)
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeDialog()
    }
  })
  dialog.addEventListener('close', () => {
    if (returnFocusTo?.isConnected) {
      returnFocusTo.focus()
    } else if (returnTaskId !== null) {
      const replacementButton = Array.from(
        document.querySelectorAll<HTMLButtonElement>('[data-edit-task-id]'),
      ).find((button) => button.dataset.editTaskId === returnTaskId)
      replacementButton?.focus()
    }

    returnFocusTo = null
    returnTaskId = null
  })

  return {
    openForCreate: (opener) => prepareDialog(null, opener),
    openForEdit: (task, opener) => prepareDialog(task, opener),
  }
}
