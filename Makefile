include .env
export

all:
	docker compose up --build -d

verbose:
	docker compose up --build

build:
	docker compose build -d

start:
	docker compose up -d

logs:
	docker compose logs -f

stop:
	docker compose down

remove_images:
	docker compose down --rmi all

remove_volumes:
	docker volume rm cleangame_postgres_data 

clean:
	docker compose down --rmi all -v

fclean: clean
	docker system prune --all --force

re:	fclean all

.PHONY: all build start logs stop remove_images clean fclean re
