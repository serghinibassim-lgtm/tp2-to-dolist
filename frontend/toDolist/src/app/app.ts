import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Task } from './task.model';
import { TaskService } from './task.service';

@Component({
  imports: [FormsModule, MatToolbarModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatListModule, MatCheckboxModule, MatIconModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = 'ToDo List';

  tasks = signal<Task[]>([]);
  newTitle = signal('');
  editingId = signal<string | null>(null);
  editingTitle = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load tasks');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  addTask(): void {
    const title = this.newTitle().trim();
    if (!title) return;
    this.taskService.addTask(title).subscribe({
      next: (task) => {
        this.tasks.update((list) => [task, ...list]);
        this.newTitle.set('');
      },
      error: (err) => {
        this.error.set('Failed to add task');
        console.error(err);
      },
    });
  }

  toggleCompleted(task: Task): void {
    this.taskService.updateTask(task._id, { completed: !task.completed }).subscribe({
      next: (updated) => {
        this.tasks.update((list) =>
          list.map((t) => (t._id === updated._id ? updated : t))
        );
      },
      error: (err) => {
        this.error.set('Failed to update task');
        console.error(err);
      },
    });
  }

  startEdit(task: Task): void {
    this.editingId.set(task._id);
    this.editingTitle.set(task.title);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editingTitle.set('');
  }

  saveEdit(task: Task): void {
    const title = this.editingTitle().trim();
    if (!title) return;
    this.taskService.updateTask(task._id, { title }).subscribe({
      next: (updated) => {
        this.tasks.update((list) =>
          list.map((t) => (t._id === updated._id ? updated : t))
        );
        this.cancelEdit();
      },
      error: (err) => {
        this.error.set('Failed to update task');
        console.error(err);
      },
    });
  }

  deleteTask(task: Task): void {
    if (!confirm('Delete this task?')) return;
    this.taskService.deleteTask(task._id).subscribe({
      next: () => {
        this.tasks.update((list) => list.filter((t) => t._id !== task._id));
      },
      error: (err) => {
        this.error.set('Failed to delete task');
        console.error(err);
      },
    });
  }
}
