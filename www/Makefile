ifeq ($(OS),Windows_NT)
	SHELL=C:/Windows/System31/cmd.exe
endif

dojo-version=master

install:
	git clone https://github.com/dojo/dojo.git dojo
	git clone https://github.com/dojo/dijit.git dijit
	git clone https://github.com/dojo/dojox.git dojox
	git clone https://github.com/dojo/util.git util
	git clone https://github.com/bhosaledipak/JsPlumb_Dojo_Integreate.git jsPlumb
	git clone https://github.com/bvds/js-expression-eval.git math-parser
	git clone https://github.com/Dragoon-Lab/topomath-solver.git math-solver
	echo "${dojo-version}" > dojo-install-version
	@echo "Installed Dojo $(dojo-version)."

update:
ifeq ($(shell test -f dojo-install-version && cat dojo-install-version),${dojo-version})
	cd dojo; git pull
	cd dijit; git pull
	cd dojox; git pull
	cd util; git pull
	cd jsPlumb; git pull
	cd math-parser; git pull
	cd math-solver; git pull
	cd ..
else
	$(MAKE) install
endif
