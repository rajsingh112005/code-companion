from asyncio import Task
from typing import Optional
class TaskManager:
    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}

    def set(self, key: str, task: Task) -> None:
        existing = self._tasks.get(key)
        if existing and not existing.done():
            existing.cancel()
        self._tasks[key] = task

    def get(self, key: str) -> Optional[Task]:
        return self._tasks.get(key)

    def cancel(self, key: str) -> Optional[Task]:
        task = self._tasks.pop(key, None)
        if task and not task.done():
            task.cancel()
        return task

    def remove(self, key: str) -> None:
        self._tasks.pop(key, None)


task_manager = TaskManager()
