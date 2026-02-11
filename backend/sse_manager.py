from asyncio import Queue

class SSEManager:
    def __init__(self):
        self.streams: dict[str, Queue] = {}

    def get_queue(self, chat_id: str) -> Queue:
        if chat_id not in self.streams:
            self.streams[chat_id] = Queue()
        return self.streams[chat_id]

    def remove(self, chat_id: str):
        self.streams.pop(chat_id, None)


sse_manager = SSEManager()