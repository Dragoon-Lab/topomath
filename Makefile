ifeq ($(OS),Windows_NT)
	SHELL=C:/Windows/System32/cmd.exe
endif

install:
	cd www; $(MAKE) install

update:
	git pull
	cd www; $(MAKE) update
