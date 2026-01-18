import asyncio
import datetime
import sqlite3

import websockets


class Server:
    def __init__(self, local_host="0.0.0.0", port=8080, db_path="chat.db"):
        self.local_host = local_host
        self.port = port
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as connection:
            cursor = connection.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS clients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    remote_host TEXT NOT NULL,
                    remote_port INTEGER NOT NULL,
                    connected_at TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER NOT NULL,
                    direction TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients (id)
                )
                """
            )
            connection.commit()

    def _record_client(self, remote_host, remote_port):
        connected_at = datetime.datetime.now().isoformat(timespec="seconds")
        with sqlite3.connect(self.db_path) as connection:
            cursor = connection.cursor()
            cursor.execute(
                """
                INSERT INTO clients (remote_host, remote_port, connected_at)
                VALUES (?, ?, ?)
                """,
                (remote_host, remote_port, connected_at),
            )
            connection.commit()
            return cursor.lastrowid

    def _record_message(self, client_id, direction, message):
        created_at = datetime.datetime.now().isoformat(timespec="seconds")
        with sqlite3.connect(self.db_path) as connection:
            cursor = connection.cursor()
            cursor.execute(
                """
                INSERT INTO messages (client_id, direction, message, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (client_id, direction, message, created_at),
            )
            connection.commit()

    def _recent_messages(self, remote_host, limit=5):
        with sqlite3.connect(self.db_path) as connection:
            cursor = connection.cursor()
            cursor.execute(
                """
                SELECT messages.created_at, messages.direction, messages.message
                FROM messages
                JOIN clients ON clients.id = messages.client_id
                WHERE clients.remote_host = ?
                ORDER BY messages.id DESC
                LIMIT ?
                """,
                (remote_host, limit),
            )
            return cursor.fetchall()

    async def client_messages(self, websocket, client_id):
        try:
            async for message in websocket:
                now = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
                print(f"{websocket.remote_address} - {now}: {message}")
                self._record_message(client_id, "client", message)
        except websockets.exceptions.ConnectionClosed:
            print("Connection was lost")

    async def server_messages(self, websocket, client_id):
        try:
            while True:
                message = await asyncio.to_thread(input, f"{self.local_host}> ")
                if not message:
                    continue
                now = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
                await websocket.send(f"{now}: {message}")
                self._record_message(client_id, "server", message)
        except websockets.exceptions.ConnectionClosed:
            print("Connection was lost")

    async def handle_connections(self, websocket, path):
        remote_host, remote_port = websocket.remote_address
        client_id = self._record_client(remote_host, remote_port)
        print(
            "new connection from "
            f"{websocket.remote_address}\n"
            "Type here to send a message..."
        )

        recent = self._recent_messages(remote_host)
        if recent:
            history_lines = [
                f"{created_at} [{direction}] {message}"
                for created_at, direction, message in reversed(recent)
            ]
            history = "\n".join(history_lines)
            await websocket.send(f"Letzte Nachrichten:\n{history}")

        try:
            await asyncio.gather(
                self.server_messages(websocket, client_id),
                self.client_messages(websocket, client_id),
            )
        except Exception as error:
            print(error)

    async def server_start(self):
        async with websockets.serve(self.handle_connections, self.local_host, self.port):
            print(f"Server has started on {self.local_host}:{self.port}")
            await asyncio.Future()


if __name__ == "__main__":
    server = Server()
    asyncio.run(server.server_start())
