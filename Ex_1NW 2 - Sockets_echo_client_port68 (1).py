import socket

client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
HOST = 'localhost'
PORT = 68

try:
    client_socket.connect((HOST, PORT))
    print(f"Connection established at {HOST}:{PORT}")
except ConnectionRefusedError:
    print("Could not connect to server")
    exit(1)

while True:
    message = input("You: ")
    if message == "/quit":
        break
    client_socket.send(message.encode('utf-8'))
    data = client_socket.recv(1024)
    if data:
        message = data.decode('utf-8')
        print(f"Server: {message}")
    else:
        print("Server closed connection")
        break

client_socket.close()
