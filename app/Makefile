.PHONY: dev build clean install docker-build docker-run

# Development server
dev:
	bun dev

# Build for production
build:
	bun run build

# Install dependencies
install:
	bun install

# Clean build artifacts
clean:
	rm -rf .next
	rm -rf node_modules
	rm -rf dist
	rm -rf build

# Docker commands
docker-build:
	docker build -t showcount-app .

docker-run:
	docker run -p 3000:3000 showcount-app
