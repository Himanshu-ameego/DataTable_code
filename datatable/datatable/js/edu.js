
const classDropdown = document.getElementById("classDropdown");
const sectionDropdown = document.getElementById("sectionDropdown");
const studentTableBody = document.getElementById("studentBody");

// Load Classes-------------------------------------------------------------------------
function loadClasses() {
  database.ref('/classes').once('value', (snapshot) => {
    snapshot.forEach((classSnap) => {
      const option = document.createElement('option');
      option.value = classSnap.key;
      option.textContent = `Class ${classSnap.key}`;
      classDropdown.appendChild(option);
    });
  });
}

// Load Sections-------------------------------------------------------------------------
function loadSections(classId) {
  sectionDropdown.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Select Section';
  sectionDropdown.appendChild(defaultOption);
  
  database.ref(`/classes/${classId}/sections`).once('value', (snapshot) => {
    snapshot.forEach((sectionSnap) => {
      const option = document.createElement('option');
      option.value = sectionSnap.key;
      option.textContent = `Section ${sectionSnap.key}`;
      sectionDropdown.appendChild(option);
    });
  });
}

// Load Students------------------------------------------------------------------------
function loadStudents(classId, sectionId) {
  $('#studentTable').DataTable().clear().destroy(); // Destroy old DataTable instance 
  studentTableBody.innerHTML = ''; // Clear existing row in the table   

  database.ref(`/classes/${classId}/sections/${sectionId}/students`).once('value', (snapshot) => {
    snapshot.forEach((studentSnap) => {
      const student = studentSnap.val();
      const row = `
        <tr data-id="${studentSnap.key}">
          <td class="editable" data-field="firstName">${student.firstName || ''}</td>
          <td class="editable" data-field="lastName">${student.lastName || ''}</td>
          <td class="editable" data-field="age">${student.age || ''}</td>
        </tr>`;
      studentTableBody.insertAdjacentHTML('beforeend', row);
    });

    // Reinitialize DataTable (!important)----------------------------------------------
    $('#studentTable').DataTable();

    // Enable Inline Editing
    enableInlineEditing(classId, sectionId);
  });
}
function enableInlineEditing(classId, sectionId) {
  document.querySelectorAll('.editable').forEach((cell) => {
    cell.addEventListener('click', function () {
      if (cell.contentEditable === "true") return;

      // Save the original value
      const originalValue = cell.textContent;

      // Make the cell editable
      cell.contentEditable = "true";
      cell.focus();

      // Remove the cursor when editing is finished
      cell.addEventListener('blur', function () {
        const newValue = cell.textContent;
        if (newValue !== originalValue) {
          const studentId = cell.closest('tr').dataset.id;
          const field = cell.dataset.field;
          const updatePath = `/classes/${classId}/sections/${sectionId}/students/${studentId}/${field}`;
        
          // Update Firebase with the new value
          database.ref(updatePath).set(newValue, (error) => {
            if (error) {
              alert('Failed to save changes');
              cell.textContent = originalValue; // Revert changes
            } else {
              // Add saved-row class to the entire row for animation
              const row = cell.closest('tr');
              row.classList.add('saved-row');
              setTimeout(() => {
                row.classList.remove('saved-row');
              }, 1000); 
            }
          });
        }
        cell.contentEditable = "false";
      });

      // Listen for Enter key to save changes
      cell.addEventListener('keydown', function (e) {
        if (e.key === "Enter") {
          e.preventDefault();  // Prevent the default Enter behavior (like moving to the next line)
          const newValue = cell.textContent;
          if (newValue !== originalValue) {
            const studentId = cell.closest('tr').dataset.id;
            const field = cell.dataset.field;
            const updatePath = `/classes/${classId}/sections/${sectionId}/students/${studentId}/${field}`;
            
            // Update Firebase with the new value
            database.ref(updatePath).set(newValue, (error) => {
              if (error) {
                alert('Failed to save changes');
                cell.textContent = originalValue; // Revert changes
              } else {
                // Add saved-row class to the entire row for animation
                const row = cell.closest('tr');
                row.classList.add('saved-row');
                setTimeout(() => {
                  row.classList.remove('saved-row');
                }, 1000); 
              }
            });
          }
          cell.contentEditable = "false";  // Close editing mode
        }
      });
    });
  });
}


// Event Listeners
classDropdown.addEventListener('change', (e) => {
  const classId = e.target.value;
  loadSections(classId);
});

sectionDropdown.addEventListener('change', (e) => {
  const sectionId = e.target.value;
  const classId = classDropdown.value;
  if (classId && sectionId) {
    loadStudents(classId, sectionId);
  }
});

// Initial Load
loadClasses();
