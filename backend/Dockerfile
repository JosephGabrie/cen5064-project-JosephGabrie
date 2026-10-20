# Build stage
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

# Pre-copy go.mod and go.sum for caching layers
COPY go.mod go.sum ./
RUN go mod download

# Copy backend source
COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./main/main.go

# Minimal runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/server .

EXPOSE 6769

CMD ["./server"]
