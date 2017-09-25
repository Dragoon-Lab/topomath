pipeline {
    agent any 
    cleanWs()

    stages {
        stage('Install') { 
            steps {
                checkout scm
                sh 'make install'
            }
        }
        stage('Build'){
            steps {
                sh 'cd www'
                sh 'npm run build'
            }
        }
    }
}
