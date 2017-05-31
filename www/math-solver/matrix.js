define([], function(){
	/**
	* adds the matrices
	* @params -	a - matrix 1
	* 			b - matrix 2
	* @return -	c - answer - a + b
	**/
	function addition(/* Matrix */ a, /* Matrix */ b){
		var isValid = _validateMatrices(a, b);
		if(!isValid.add)
			throw new Error("Matrices can not be added as dimensions do not match");

		var c = new Matrix(a.rows, a.cols);
		for(var i = 0; i < a.rows; i++)
			for(var j = 0; j < a.cols; j++)
				c[i][j] = a[i][j] + b[i][j];

		return c;
	}

	/**
	* subtracts the matrices
	* @params -	a - matrix 1
	* 			b - matrix 2
	* @return -	c - answer - a - b
	**/
	function subtract(/* Matrix */ a, /* Matrix */ b){
		var isValid = _validateMatrices(a, b);
		if(!isValid.add)
			throw new Error("Matrices can not be subtracted as dimensions do not match");

		var c = new Matrix(a.rows, a.cols);
		for(var i = 0; i < a.rows; i++)
			for(var j = 0; j < a.cols; j++)
				c[i][j] = a[i][j] - b[i][j];

		return c;
	}

	/**
	* multiplies the matrices
	* requires that number of columns of a are equal to number of rows b
	* @params -	a - matrix 1
	* 			b - matrix 2
	* @return -	c - answer - a * b
	**/
	function multiply(/* Matrix */ a, /* Matrix */ b){
		var isValid = _validateMatrices(a, b);
		if(!isValid.mul)
			throw new Error("Matrices can not be multiplied as dimensions do not match");

		var c = new Matrix(a.rows, a.cols, 0);
		for(var i = 0; i < a.rows; i++)
			for(var j = 0; j < b.cols; j++)
				for(var k = 0; k < a.cols; k++)
					c[i][j] += a[i][k]*b[k][j];

		// TODO: update the multiplication algorithm from Intro to algorithms
		// which is less than O(n^3)
		return c;
	}

	/**
	* Creates the matrix object. Has three basic constructors based on the
	* parameters sent.
	* The parameters are defined on each function in the object
	* @return -	rows - number of rows in the matrix
	*			cols - number of columns in the matrix
	*			data - the values in the matrix
	**/
	function Matrix(arguments){
		this.rows = Number.MIN_VALUE;
		this.cols = Number.MIN_VALUE;
		this.data = [];

		/**
		* constructor with one parameter
		* @params -	data - the numbers stored in a matrix
		**/
		var _matrixOneArgument = function(/* 2D array*/ data){
			if(!data)
				throw new Error("No data provided to create the matrix");
			this.rows = data.length;

			// although this essentially means the same check as above
			// keeping it so that we can be rest assured
			// that data is not empty
			if(this.rows == 0)
				throw new Error("No data provided to create the matrix");

			this.cols = data[0].length;
			for(var i = 0; i < this.rows; i++)
				if(data[i].length !== this.cols)
					throw new Error("Matrix has varying number of columns");

			this.data = data;
		}

		/**
		* constructor with two parameters. values of the matrix are initialized to
		* the value given by the user or Number.MIN_VALUE.
		* Reason to initialize these values is to ensure that the size of the matrix
		* is fixed.
		* @params -	rows - number of rows
		*			cols - number of columns
		**/
		var _matrixThreeArgument = function(/* integer */ rows, /* integer */ cols, /* number*/ initialization){
			var initialValue = (initialization !== NaN) ? initialization : Number.MIN_VALUE;
			this.rows = rows;
			this.cols = cols;
			for(var i = 0; i < rows; i++){
				this.data[i] = [];
				for(var j = 0; j < cols; j++){
					this.data[i][j] = initialValue;
				}
			}
		}

		/**
		* switch case to handle the constructors as per the parameters sent to create the class.
		**/
		switch(arguments.length){
			case 1:
				_matrixOneArgument(arguments[0]);
				break;
			case 2:
				_matrixThreeArgument(arguments[0], arguments[1]);
				break;
			case 3:
				_matrixThreeArgument(arguments[0], arguments[1], arguments[2]);
				break;
			case default:
				throw new Error("Wrong initialization of Matrix class");
				break;
		}

	}

	/**
	* operations that are availble. Have made this to be static and can be accessed directly from
	* the Matrix class definition.
	**/
	Matrix.operations = {
		add: addition,
		sub: subtraction,
		mul: multiply
	};

	/**
	* creates a square matrix with all values holding same data.
	**/
	Matrix.createSquareMatrix = function(/* integer */ size, /* number */ value){
		return new Matrix(size, size, value);
	};

	Matrix.createIdentityMatrix = function(/* integer */ size){
		var I = new Matrix.createSquareMatrix(size, 0);
		for(var i = 0; i < size; i++)
			I[i][i] = 1;

		return I;
	};

	Matrix.prototype = {
		/**
		* gets the column data for a matrix
		* @params -	index - column index that is needed for the matrix
		* @return -	colData - array of data in the column at the index.
		*					if the index is greater than column then returns an empty array.
		**/
		getColumn: function(/* integer */ index){
			var colData = [];
			if(index < this.cols)
				for(var i = 0; i < this.cols; i++)
					colData[i] = this.data[i][index];

			return colData;
		},
		/**
		* gets the row data for a matrix
		* @params -	index - row index that is needed for the matrix
		* @return -	colData - array of data in the row at the index.
		*					if the index is greater than row then returns an empty array.
		**/
		getRow: function(/* integer */ index){
			var rowData = [];
			if(index < this.rows)
				for(var i = 0; i < this.rows; i++)
					rowData[i] = this.data[index][i];

			return rowData;
		},

		/**
		* checks whether the matrix is square or not.
		* @return - boolean value if number of rows are equal to number of columns
		**/
		isSquare: function(){
			return this.rows && this.rows == this.cols;
		},

		/**
		* print the matrix in either JavaScript 2D-array format or in Matlab Matrix format
		* @params -	divID - the id of the div in which the matrix is to be printed
		*			isJS - print matrix in JS (true) format or in Matlab (false) format
		**/
		print: function(/* string */ divID, /* boolean */ isJS){
			var div = document.getElementByID(divID);

			if(!div){
				var div = document.createElement('div');
			}
			var html = '[';

			var rowBreak = isJS ? "]," : ";";
			for(var i = 0; i < this.rows; i++){
				html += '[';
				for(var j = 0; j < this.cols; j++){
					if(j == this.cols - 1)
						html += this.data[i][j];
					else
						html += this.data[i][j] + ", ";
				}
				if(i === this.rows -1)
					html += rowBreak;
				else
					html += rowBreak + "\n";
			}
			if(isJS)
				html = html.splice(0, -1);

			html += ']';

			div.innerHTML = html;
			document.body.appendChild(div);
		}
	};

	/**
	* validates the matrices for operations.
	* @params -	a - First matrix on the left side of the operator.
	* 			b - Second matrix on the right side of operator.
	* @return -	isValid - object which tells whether the matrices can be 
	*					added subtracted and multiplied or not.
	**/
	function _validateMatrices(/* Matrix */ a, /* Matrix */ b){
		var isValid = {
			add : false,
			mul : false,
			inv : false
		};
		// Case for inversion, there is only one matrix sent in input
		if(!b){
			isValid.inv = a.isSquare();
			return isValid;
		}

		if(!a || !b)
			return isValid;

		// Case 1 - square matrix with equal rows and columns in both 3X3 matrices
		// Case 2 - rows and columns of both the matrices are same like 3X4 and 3X4 matrices
		// Case 3 - columns of first are equal to rows of the second 3X4 and 4X3 matrices
		if(a.rows == b.rows && a.cols == b.cols && a.rows = a.cols){
			isValid.add = true;
			isValid.mul = true;
		} else if(a.rows == b.rows && a.cols == b.cols){
			isValid.add = true;
		} else if(a.cols = b.rows){
			isValid.mul = true;
		}

		return isValid;
	}
});
