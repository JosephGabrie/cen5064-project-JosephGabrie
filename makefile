-include .env

make:
	kitty -d ./frontend npm run dev &
	kitty -d ./backend/main/ go run main.go &

run_student:
	kitty -d ./frontend env NEXT_PUBLIC_AUTO_LOGIN_USER=$(STUDENT_LOGIN_USER) NEXT_PUBLIC_AUTO_LOGIN_PASSWORD=$(STUDENT_LOGIN_PASSWORD) npm run dev &
	kitty -d ./backend/main/ go run main.go &

run_teacher:
	kitty -d ./frontend env NEXT_PUBLIC_AUTO_LOGIN_USER=$(TEACHER_LOGIN_USER) NEXT_PUBLIC_AUTO_LOGIN_PASSWORD=$(TEACHER_LOGIN_PASSWORD) npm run dev &
	kitty -d ./backend/main/ go run main.go &

run_parent:
	kitty -d ./frontend env NEXT_PUBLIC_AUTO_LOGIN_USER=$(PARENT_LOGIN_USER) NEXT_PUBLIC_AUTO_LOGIN_PASSWORD=$(PARENT_LOGIN_PASSWORD) npm run dev &
	kitty -d ./backend/main/ go run main.go &

run_admin:
	kitty -d ./frontend env NEXT_PUBLIC_AUTO_LOGIN_USER=$(ADMIN_LOGIN_USER) NEXT_PUBLIC_AUTO_LOGIN_PASSWORD=$(ADMIN_LOGIN_PASSWORD) npm run dev &
	kitty -d ./backend/main/ go run main.go &

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-restart:
	docker compose down && docker compose up --build -d
