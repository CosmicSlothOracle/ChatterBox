import socket
import select
import threading


class EchoServer:
    def __init__(self, host='localhost', port=69):
        self.host = host
        self.port = port
        self.server_socket = None
        self.connection = None

    def start_server(self):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(
            socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(2)  # Warteschlange für 2 Verbindungen
        print(f"Server is listening on {self.host}:{self.port}")

        self.connection, client_address = self.server_socket.accept()
        print(f"Client connected from {client_address} on port {self.port}")

        while True:
            # Option A: Mit select
            readable, _, exceptional = select.select(
                [self.connection], [], [self.connection], 0.1)

            # Fehler prüfen
            for sock in exceptional:
                print(f"Error on socket {sock}")
                break  # Aus Schleife ausbrechen

            # Daten prüfen
            for sock in readable:
                if sock == self.connection:
                    data = self.connection.recv(1024)
                    if data:
                        received_message = data.decode('utf-8')
                        print(
                            f"[Port {self.port}] Received message: {received_message}")
                        self.connection.send(data)  # Echo zurück
                    else:
                        print(f"[Port {self.port}] Client disconnected")
                        self.connection.close()
                        self.server_socket.close()
                        return

    def close(self):
        if self.connection:
            self.connection.close()
        if self.server_socket:
            self.server_socket.close()


def run_server(port):
    """Server-Funktion für Thread"""
    server = EchoServer(port=port)
    server.start_server()


if __name__ == "__main__":
    # Zwei Ports definieren
    PORT1 = 68
    PORT2 = 69

    # Server für Port 1 in Thread starten
    thread1 = threading.Thread(target=run_server, args=(PORT1,), daemon=True)
    thread1.start()
    print(f"Started server on port {PORT1}")

    # Server für Port 2 in Thread starten
    thread2 = threading.Thread(target=run_server, args=(PORT2,), daemon=True)
    thread2.start()
    print(f"Started server on port {PORT2}")

    # Hauptthread am Leben halten
    try:
        while True:
            threading.Event().wait(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
