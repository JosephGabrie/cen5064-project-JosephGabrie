make:
	kitty -d ./frontend npm run dev &
	kitty -d ./backend/main/ go run server.go &

run_student:
	kitty -d ./frontend env NEXT_PUBLIC_AUTO_LOGIN_USER=438813 NEXT_PUBLIC_AUTO_LOGIN_PASSWORD=041210SS npm run dev &
	kitty -d ./backend/main/ go run server.go &

run_teacher:
	kitty -d ./frontend env NEXT_PUBLIC_AUTO_LOGIN_USER=31229834 NEXT_PUBLIC_AUTO_LOGIN_PASSWORD=082580TT npm run dev &
	kitty -d ./backend/main/ go run server.go &

run_parent:

run_admin:
	kitty -d ./frontend env NEXT_PUBLIC_AUTO_LOGIN_USER=31864322 NEXT_PUBLIC_AUTO_LOGIN_PASSWORD=113075AA npm run dev &
	kitty -d ./backend/main/ go run server.go &
