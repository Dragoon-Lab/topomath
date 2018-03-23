pipeline {
    agent any     

    stages {
        stage('Checkout'){
            steps {                
                cleanWs()
                echo env.BRANCH_NAME
                checkout scm
            }
        }
        stage('Install') { 
            steps {
                sh 'cp tests/scripts/example-test-paths.js tests/scripts/test-paths.js'
                sh 'make install'
		sh 'touch db_user_password'
            }
        }
        stage('Test'){
            steps {
                dir("www"){
                    sh 'gulp test'
                }
            }
        }
        stage('Build'){
            steps {
                dir("www"){
                    sh 'npm run build'
                }
            }
        }
    }
    post{
        always {
            dir("release") {
	        sh 'cat build-output.txt || true'
	        sh 'cat www/build-report.txt || true'
		sh 'cat live/www/build-report.txt || true'
	    }
	}
    }
}
