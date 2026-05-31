#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

int main(int argc, char **argv) {
    int port = 3000;
    if (argc > 1) {
        port = atoi(argv[1]);
    }
    int socketfd;
    struct sockaddr_in myAddr, remoteAddr;

    char buffer[1024];
    socklen_t addrSize;

    socketfd = socket(AF_INET, SOCK_DGRAM, 0);

    if (socketfd < 0) {
        perror("socket creation failed");
        return -1;
    }

    memset(&myAddr, '\0', sizeof(myAddr));
    myAddr.sin_family = AF_INET;
    myAddr.sin_port = htons(port);
    myAddr.sin_addr.s_addr = inet_addr("127.0.0.1");

    int val = bind(socketfd, (struct sockaddr *)&myAddr, sizeof(myAddr));

    if (val < 0) {
        perror("bind failed");
        close(socketfd);
        return -1;
    }

    addrSize = sizeof(remoteAddr);

    ssize_t bytes = recvfrom(socketfd, buffer, 1024, 0, (struct sockaddr *)&remoteAddr, &addrSize);
    if (bytes < 0) {
        perror("recvfrom failed");
        close(socketfd);
        return -1;
    }

    printf("Received %zd bytes\n", bytes);

    printf("Received from %s:%d: %s\n", inet_ntoa(remoteAddr.sin_addr), ntohs(remoteAddr.sin_port), buffer);

    close(socketfd);    
    return 0;
}