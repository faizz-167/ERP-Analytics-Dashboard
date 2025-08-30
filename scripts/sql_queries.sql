CREATE TABLE Enrollment (
    StudentID INT PRIMARY KEY,
    Name NVARCHAR(100),
    Program NVARCHAR(50),
    EnrollmentDate DATE,
    Department NVARCHAR(50)
);

CREATE TABLE Attendance (
    StudentID INT,
    Date DATE,
    Status NVARCHAR(20),
    PRIMARY KEY (StudentID, Date),
    FOREIGN KEY (StudentID) REFERENCES Enrollment(StudentID)
);

CREATE TABLE Grades (
    StudentID INT,
    Course NVARCHAR(50),
    Grade INT,
    PRIMARY KEY (StudentID, Course),
    FOREIGN KEY (StudentID) REFERENCES Enrollment(StudentID)
);

CREATE INDEX idx_Department ON Enrollment(Department);
CREATE INDEX idx_StudentID ON Attendance(StudentID);

-- Corrected stored procedure
CREATE PROCEDURE InsertEnrollment
    @StudentID INT,
    @Name NVARCHAR(100),
    @Program NVARCHAR(50),
    @EnrollmentDate DATE,
    @Department NVARCHAR(50)
AS
BEGIN
    INSERT INTO Enrollment (StudentID, Name, Program, EnrollmentDate, Department)
    VALUES (@StudentID, @Name, @Program, @EnrollmentDate, @Department);
END;