

# Task 02 - Calculator using Maven

## Objective

Build a simple Java Calculator application using Maven, execute unit tests, package the application as an executable JAR file, and verify that the generated artifact runs successfully.

---

## Environment

| Component | Version |
|----------|---------|
| OS | Ubuntu 22.04 |
| Java | OpenJDK 17 |
| Maven | 3.9.x |
| Git | Latest |

---

## Project Structure

```text
Task-02-Calculator-Maven/
├── .gitignore
├── pom.xml
├── README.md
└── src
    ├── main
    └── test
```

---

## Implementation Steps

### 1. Verify Java Installation

```bash
java -version
```

### 2. Install Maven

```bash
sudo apt update
sudo apt install maven
```

### 3. Verify Maven Installation

```bash
mvn -version
```

### 4. Run Unit Tests

```bash
mvn test
```

Expected result:

```text
BUILD SUCCESS
```

### 5. Build the Project

```bash
mvn package
```

This command performs the following:

- Compiles the source code.
- Executes all unit tests.
- Packages the application.
- Generates an executable JAR file.

Generated artifact:

```text
target/calculator.jar
```

### 6. Run the Application

```bash
java -jar target/calculator.jar
```

### 7. Verify Output

```text
Enter first number: 5
Enter second number: 5

a = 5.0, b = 5.0
Sum: 10.0
Subtract: 0.0
Multiply: 25.0
Divide: 1.0
```

---

## Maven Lifecycle Used

| Phase | Command | Purpose |
|------|---------|---------|
| Validate | Automatic | Validate project structure |
| Compile | Included in `mvn package` | Compile Java source code |
| Test | `mvn test` | Execute JUnit tests |
| Package | `mvn package` | Generate executable JAR |

---

## Commands Used

```bash
# Verify Java
java -version

# Install Maven
sudo apt update
sudo apt install maven

# Verify Maven
mvn -version

# Run Unit Tests
mvn test

# Build Application
mvn package

# Run Application
java -jar target/calculator.jar
```

---

## Technologies Used

- Java 17
- Apache Maven
- JUnit
- Git
- Ubuntu Linux

---

## Key Learning

During this task, I learned how to:

- Understand the standard Maven project structure.
- Work with the `pom.xml` build configuration file.
- Execute Maven lifecycle phases.
- Run JUnit tests using Maven.
- Package Java applications into executable JAR files.
- Manage generated build artifacts inside the `target` directory.
- Exclude generated files from Git using `.gitignore`.
- Organize a Java project following Maven best practices.

---

## Repository Notes

- The project follows the standard Maven directory layout.
- Dependencies are managed through `pom.xml`.
- Build artifacts are generated automatically in the `target` directory.
- The `target` directory is excluded from version control using `.gitignore`.
- Maven automatically downloads all required dependencies during the build process.

---

## Future Improvements

Possible enhancements include:

- Add more mathematical operations.
- Improve exception handling.
- Add input validation.
- Increase unit test coverage.
- Integrate the project into a CI/CD pipeline using Jenkins.

---

## Author

**Abdulrhman Mohammed**

Junior DevOps Engineer  
iVolve Technologies Trainee
