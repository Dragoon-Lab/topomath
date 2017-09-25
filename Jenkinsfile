pipeline {
    agent any     

    stages {
        stage('Checkout'){
            steps {
                cleanWs()
                checkout scm
            }
        }
        stage('Install') { 
            steps {
                sh 'make install'
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
}
