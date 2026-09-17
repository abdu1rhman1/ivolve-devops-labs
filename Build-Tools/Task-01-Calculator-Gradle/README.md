

# Task 01 - Calculator using Gradle

## Objective

Build a simple Java Calculator application using Gradle, package it as an executable JAR file, and verify its functionality using JUnit tests.

---

## Prerequisites

Before starting this task, make sure you have:

- Ubuntu 22.04
- Java 17
- Gradle 8.14.3
- Git

---

## Project Structure

```text
Task-01-Calculator-Gradle/
├── README.md
├── build.gradle
├── settings.gradle
└── src
    ├── main
    └── test
```

---

## Implementation Steps

1. Installed Java 17.
2. Installed Gradle 8.14.3.
3. Configured the `GRADLE_HOME` environment variable.
4. Added Gradle to the system `PATH`.
5. Verified the Gradle installation.
6. Built the project using:

```bash
gradle build
```

7. Executed the unit tests:

```bash
gradle test
```

8. Generated the executable JAR file:

```bash
gradle jar
```

9. Ran the application:

```bash
java -jar build/libs/calculator.jar
```

10. Uploaded the completed project to GitHub.

---

## Sample Output

```text
Enter first number: 10
Enter second number: 5

Sum: 15.0
Subtract: 5.0
Multiply: 50.0
Divide: 2.0
```

---

## Technologies Used

- Java
- Gradle
- Git
- GitHub
- JUnit 5

---

## What I Learned

- Installing and configuring Gradle.
- Managing Java projects with Gradle.
- Running unit tests using JUnit.
- Building executable JAR files.
- Running Java applications from the terminal.
- Using Git and GitHub to manage project versions.
