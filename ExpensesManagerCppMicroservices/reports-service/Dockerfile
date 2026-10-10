# STAGE 1: BUILD
FROM ubuntu:24.04 AS builder

LABEL authors="user-of-github"
ENV DEBIAN_FRONTEND=noninteractive

# 1. Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libssl-dev \
    libpq-dev \
    libpqxx-dev \
    libxlsxwriter-dev \
    libasio-dev \
    zlib1g-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 2. Install CMake
RUN curl -sSL https://github.com/Kitware/CMake/releases/download/v4.4.4/cmake-4.4.4-linux-x86_64.sh -o /tmp/cmake-install.sh && \
    chmod +x /tmp/cmake-install.sh && \
    /tmp/cmake-install.sh --skip-license --prefix=/usr/local && \
    rm /tmp/cmake-install.sh

# 3. Install Crow (header-only)
WORKDIR /tmp
RUN git clone https://github.com/CrowCpp/Crow.git && \
    cd Crow && \
    mkdir build && cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    make install && \
    cd / && rm -rf /tmp/Crow

# 4. Build reports-service
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
    libpq5 \
    libpqxx-7.8t64 \
    libxlsxwriter5t64 \
    zlib1g \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /usr/local/lib/ /usr/local/lib/
COPY --from=builder /app/build/reports_service /app/reports_service

RUN ldconfig

EXPOSE 4001

CMD ["/app/reports_service"]
