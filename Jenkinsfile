pipeline {
    agent any     

    stages {
        stage('Install') { 
            steps {
                cleanWs()
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
