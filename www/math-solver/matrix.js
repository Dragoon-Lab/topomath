define([], function(){
	// this is the value less than which we will try to find a different pivot
	var _epsilon = 0.01;

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
				c.m[i][j] = a.m[i][j] + b.m[i][j];

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
				c.m[i][j] = a.m[i][j] - b.m[i][j];

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
					c.m[i][j] += a.m[i][k]*b.m[k][j];

		// TODO: update the multiplication algorithm from Intro to algorithms
		// which is less than O(n^3)
		return c;
	}

	/**
	* inverts a given square matrix using LU decomposition and partial pivoting.
	* validateMatrices checks whether a matrix is square or not. Throws an error
	* if the matrix is not square.
	* @params -	a - Matrix to be inverted
	* @return -	c - Inverted matrix
	**/
	function invert(/* Matrix */ a){
		var isValid = _validateMatrices(a);

		if(!isValid.inv)
			throw new Error("Matrix can not be inverted as it is not a square Matrix");

		var c = new Matrix(a.rows, a.cols, 0);
		var decomposition = _LUdecomposition(a);
		var I = Matrix.identity(a.rows);
		var pivot;
		for(pivot in decomposition.pivots){
			var temp = pivot.split("|");
			I.swap(temp[0], temp[1]);
		}

		for(var i = 0; i < a.cols; i++){
			var col = _solve(decomposition.L, decomposition.U, I.getColumn(i));
			c.setColumn(i, col);
		}

		return c;
	}

	/**
	* solves the equation of the form Ax = b using LU decomposition.
	* due to decomposition solution is calculated in two steps
	* Ld = b, calculate d vector in this, then Ux = d calculate x in this.
	* @params -	L - Lower triangle matrix with diagonals equal to 1
	*			U - Upper triangle matrix
	*			b - Right hand side vector of the equation Ax = b
	* @return -	x - solution vector calculated as per above steps
	**/
	function _solve(/* Matrix */ L, /* Matrix */ U, /* Matrix or col vector */ b){
		var d = [];
		d[0] = b[0];
		for(var i = 1; i < L.rows; i++){
			var sum = 0;
			for(var j = 0; j < i; j++){
				sum += L.m[i][j]*d[j];
			}
			d[i] = b[i] - sum;
		}

		var x = [];
		x[U.rows - 1] = d[L.rows - 1];
		for(i = U.rows - 2; i >= 0; i--){
			sum = 0;
			for(j = U.rows - 1; j > i; j--){
				sum += U.m[i][j] * x[j];
			}
			x[i] = (d[i] - sum)/U[i][i];
		}

		return x;
	}

	/**
	* calculated LU decomposition of any given square matrix (A). Initially L is set to
	* identity matrix and U is set to A matrix. Iterative calculations are done using
	* equations from LU = A. Pivots are corrected if diagonal elements go below 0.01.
	* @params -	a - Matrix whose inverse is to be calculated
	* @return -	obj - a JSON object which holds -
	*				L - Lower triangle matrix for the decomposition
	*				U - Upper triangle matrix for the decomposition
	*				pivots - row exchanges that were needed for the inverse calculation
	**/
	function _LUdecomposition(/* Matrix */ a){
		var L = Matrix.identity(a.rows);
		var U = Matrix.copy(a);
		var pivots = [];

		for(var i = 0; i < a.cols - 1; ){
			if(U.m[i][i] > _epsilon){
				for(var j = i+1; j < a.rows; j++){
					L.m[j][i] = U.m[j][i] / U.m[i][i];
					for(var k = i; k < a.cols; k++)
						U.m[j][k] = U.m[j][k] - L.m[j][k]*U.m[i][k];
				}
				i++;
			} else {
				var pivot = _pivot(U, i);
				if(pivot == i)
					throw new Error("Singular matrix, LU decomposition not feasible");
				pivots.push(i + "|" +  pivot);
				U.swap(i, pivot);
				L.swap(i, pivot);
				// resetting the values of diagonals to be 1 as swapping will lead to issues
				L.m[i][i] = 1;
				L.m[pivot][pivot] = 1;
				L.m[i][pivot] = 0;
			}
		}

		return {
			L: L,
			U: U,
			pivots: pivots
		};
	}

	/**
	* finds the row which should be switched with the diagonal element of the matrix.
	* calculated by finding maximum number after diagonal element which is to be swapped.
	* @params -	a - matrix for which pivot is to swapped.
	* 			index - index of the pivot element which is to be swapped.
	* @return -	returnIndex - new pivot index that is calculated. If all the
	*				values are less than _epsilon value set at the top,
	*				then index is returned which is the error case.
	**/
	function _pivot(/* Matrix */ a, /* integer */ index){
		var returnIndex = index;
		var value = Math.abs(a.m[index][index]);
		for(var i = index + 1; i < a.rows; i++){
			var temp = Math.abs(a.m[i][index]);
			if(temp > _epsilon && temp > value){
				value = temp;
				returnIndex = i;
			}
		}

		return returnIndex;
	}

	/**
	* Creates the matrix object. Has three basic constructors based on the
	* parameters sent.
	* The parameters are defined on each function in the object
	* @return -	rows - number of rows in the matrix
	*			cols - number of columns in the matrix
	*			m - the values in the matrix
	**/
	function Matrix(){
		var rows = Number.MIN_VALUE;
		var cols = Number.MIN_VALUE;
		var m = [];

		/**
		* constructor with one parameter
		* @params -	data - the numbers stored in a matrix
		**/
		var _matrixOneArgument = function(/* 2D array*/ data){
			if(!data)
				throw new Error("No data provided to create the matrix");
			rows = data.length;

			// although this essentially means the same check as above
			// keeping it so that we can be rest assured
			// that data is not empty
			if(this.rows == 0)
				throw new Error("No data provided to create the matrix");

			cols = data[0].length;
			for(var i = 0; i < this.rows; i++)
				if(data[i].length !== this.cols)
					throw new Error("Matrix has varying number of columns");

			m = data;
		}

		/**
		* constructor with two parameters. values of the matrix are initialized to
		* the value given by the user or Number.MIN_VALUE.
		* Reason to initialize these values is to ensure that the size of the matrix
		* is fixed.
		* @params -	rows - number of rows
		*			cols - number of columns
		**/
		var _matrixThreeArgument = function(/* integer */ _rows, /* integer */ _cols, /* number*/ initialization){
			var initialValue = !isNaN(initialization) ? initialization : Number.MIN_VALUE;
			rows = _rows;
			cols = _cols;
			for(var i = 0; i < rows; i++){
				m[i] = [];
				for(var j = 0; j < cols; j++){
					m[i][j] = initialValue;
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
			default:
				throw new Error("Wrong initialization of Matrix class");
				break;
		}

		this.rows = rows;
		this.cols = cols;
		this.m = m;
	}

	/**
	* operations that are availble. Have made this to be static and can be accessed directly from
	* the Matrix class definition.
	**/
	Matrix.operations = {
		add: addition,
		sub: subtract,
		mul: multiply,
		inv: invert
	};

	/**
	* creates a square matrix with all values holding same data.
	* @params -	size - size of the square matrix
	* 			value - single value that is to be added to each data point.
	* @return -	Matrix - a matrix which is a square matrix.
	**/
	Matrix.square = function(/* integer */ size, /* number */ value){
		return new Matrix(size, size, value);
	};

	/**
	* creates an identity matrix with diagonal values set to 1 and rest of the values
	* set to 0.
	* @params - size - number of rows and columns in the matrix.
	* @return -	I - identity matrix.
	**/
	Matrix.identity = function(/* integer */ size){
		var I = new Matrix.square(size, 0);
		for(var i = 0; i < size; i++)
			I.m[i][i] = 1;

		return I;
	};

	/**
	* copies a given matrix to a new matrix. Used to copy A to U for LU decomposition
	* @params -	a - Matrix to be copied
	* @return -	mat - new Matrix created after copying.
	**/
	Matrix.copy = function(/* Matrix */ a){
		var mat = new Matrix(a.rows, a.cols);
		for(var i = 0; i < a.rows; i++)
			mat.m[i] = a.m[i].slice(0);

		return mat;
	};

	Matrix.prototype = {
		/**
		* gets the column data for a matrix
		* @params -	index - column index that is needed for the matrix
		* @return -	colData - array of data in the column at the index.
		*				if the index is greater than column then returns an empty array.
		**/
		getColumn: function(/* integer */ index){
			var colData = [];
			if(index < this.cols)
				for(var i = 0; i < this.cols; i++)
					colData[i] = this.m[i][index];

			return colData;
		},
		/**
		* gets the row data for a matrix
		* @params -	index - row index that is needed for the matrix
		* @return -	rowData - array of data in the row at the index.
		*				if the index is greater than row then returns an empty array.
		**/
		getRow: function(/* integer */ index){
			var rowData = [];
			if(index < this.rows)
				for(var i = 0; i < this.rows; i++)
					rowData[i] = this.m[index][i];

			return rowData;
		},

		/**
		* sets a column of a Matrix
		* @params -	index - index at which the column has to be set.
		*			col - column vector that has to be set at index.
		* @return -	boolean value -	0 - not successful due to size mismatch
		*							1 - successful
		**/
		setColumn: function(/* integer */ index, /* 1D array */ col){
			if(col.length != this.rows)
				return 0;

			for(var i = 0; i < this.rows; i++)
				this.m[i][index] = col[i];
			return 1;
		},

		/**
		* sets a row of a Matrix
		* @params -	index - index at which the row has to be set.
		*			row - row vector that has to be set at index.
		* @return -	boolean value -	0 - not successful due to size mismatch
		*							1 - successful
		**/
		setRow: function(/* integer */ index, /* 1D array */ row){
			if(row.length != this.cols)
				return 0;

			for(var i = 0; i < this.cols; i++)
				this.m[index][i] = row[i];
			return 1;
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
			var div = document.getElementById(divID);

			if(!div){
				var div = document.createElement('div');
			}

			div.innerHTML = this.getHTML(isJS);
			document.body.appendChild(div);
		},

		/**
		* create HTML string in either JavaScript 2D-array format or in Matlab Matrix format
		* @params -	isJS - print matrix in JS (true) format or in Matlab (false) format
		* @return -	html - returns the html string to be printed
		**/
		getHTML: function(isJS){
			var html = '[';
			var rowBreak = isJS ? "]," : ";";
			for(var i = 0; i < this.rows; i++){
				html += isJS ? '[' : '';
				for(var j = 0; j < this.cols; j++){
					if(j == this.cols - 1)
						html += this.m[i][j];
					else
						html += this.m[i][j] + ", ";
				}
				if(i === this.rows -1)
					html += rowBreak;
				else
					html += rowBreak + "\n";
			}
			if(isJS)
				html = html.slice(0, -1);

			html += ']';
			return html;
		},

		/**
		* swap row i and row j
		* @params -	i - first index of the rows
		* 			j - second index to swap the rows
		* @return -	flag - values to tell whether swap was successful or not
		* 				0 - there was an error, which is i and j were greater than
		* 				the number of rows or i and j were less than 0.
		*				1 - swap was successful.
		**/
		swap: function(/* integer */ i, /* integer */ j){
			var flag = 0;
			if(i >= this.rows || j >= this.rows || i < 0 || j < 0)
				return flag;

			for(var k = 0; k < this.rows; k++){
				var temp = this.m[i][k];
				this.m[i][k] = this.m[j][k];
				this.m[j][k] = temp;
			}

			flag = 1;
			return flag;
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
		if(a.rows == b.rows && a.cols == b.cols && a.rows == a.cols){
			isValid.add = true;
			isValid.mul = true;
		} else if(a.rows == b.rows && a.cols == b.cols){
			isValid.add = true;
		} else if(a.cols = b.rows){
			isValid.mul = true;
		}

		return isValid;
	}

	return Matrix;
});
