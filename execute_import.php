<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$db   = 'dolgo_db';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$sql = file_get_contents('import_filler.sql');

if ($conn->multi_query($sql)) {
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->next_result());
    echo "SQL Import Successful!\n";
} else {
    echo "SQL Import Failed: " . $conn->error . "\n";
}

$conn->close();
?>
