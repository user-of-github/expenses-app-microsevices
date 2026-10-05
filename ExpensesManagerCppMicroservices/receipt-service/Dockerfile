# STAGE 1: BUILD
FROM ubuntu:24.04 AS builder

LABEL authors="user-of-github"
ENV DEBIAN_FRONTEND=noninteractive

# 1. preparations - installing necessary libs
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libssl-dev \
    libjsoncpp-dev \
    uuid-dev \
    zlib1g-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Installing official CMake (apt-get provides old version??)
RUN curl -sSL https://github.com/Kitware/CMake/releases/download/v4.1.2/cmake-4.1.2-linux-x86_64.sh -o /tmp/cmake-install.sh && \
    chmod +x /tmp/cmake-install.sh && \
    /tmp/cmake-install.sh --skip-license --prefix=/usr/local && \
    rm /tmp/cmake-install.sh

# 3. DrogonCPP
WORKDIR /tmp
RUN git clone https://github.com/drogonframework/drogon.git && \
    cd drogon && \
    git submodule update --init && \
    mkdir build && cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    make -j$(nproc) && \
    make install && \
    cd / && rm -rf /tmp/drogon

# 4. Building
WORKDIR /app
COPY . .
RUN mkdir build && cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    make -j$(nproc)


# STAGE 2: RUNTIME
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libssl3 \
    libjsoncpp-dev \
    libpq5 \
    libuuid1 \
    zlib1g \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /usr/local/lib/ /usr/local/lib/
COPY --from=builder /app/build/receipt_service /app/receipt_service

RUN ldconfig

EXPOSE 8080

CMD ["/app/receipt_service"]