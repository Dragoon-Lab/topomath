pipeline {
    agent any 

    stages {
        stage('Install') { 
            steps {
                checkout scm
                sh 'make install'
            }
        }
        stage('Build'){
            steps {
                sh 'npm run build'
            }
        }
    }
}
