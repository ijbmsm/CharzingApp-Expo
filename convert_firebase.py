#!/usr/bin/env python3
import re

file_path = '/Users/sungmin/CharzingApp-Expo/src/services/firebaseService.ts'

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Backup
with open(file_path + '.backup2', 'w') as f:
    f.write(content)

# 1. Convert serverTimestamp() -> firestore.FieldValue.serverTimestamp()
content = re.sub(r'\bserverTimestamp\(\)', 'firestore.FieldValue.serverTimestamp()', content)

# 2. Convert Timestamp.fromDate() -> firestore.Timestamp.fromDate()
content = re.sub(r'\bTimestamp\.fromDate\(', 'firestore.Timestamp.fromDate(', content)

# 3. Convert .exists() -> .exists (property, not method)
content = re.sub(r'\.exists\(\)', '.exists', content)

# 4. Convert simple doc(collection(this.db, 'coll')) -> this.db.collection('coll')
content = re.sub(r"doc\(collection\(this\.db, '([^']+)'\)\)", r"this.db.collection('\1').doc()", content)

# 5. Convert deleteUserProfile method
content = re.sub(
    r"const userDocRef = doc\(this\.db, 'users', uid\);\s*await deleteDoc\(userDocRef\);",
    "const userDocRef = this.db.collection('users').doc(uid);\n      await userDocRef.delete();",
    content
)

# 6. Convert doc(this.db, 'collection', id) patterns for all collections
collections = ['users', 'diagnosisReservations', 'diagnosisReports', 'vehicleDiagnosisReports', 'userVehicles', 'settings']
for coll in collections:
    # Match: doc(this.db, 'collection', variable)
    pattern = rf"doc\(this\.db, '{coll}', ([^)]+)\)"
    replacement = rf"this.db.collection('{coll}').doc(\1)"
    content = re.sub(pattern, replacement, content)

# 7. Convert nested collection/doc patterns
# doc(this.db, 'vehicles', brandId, 'models', modelId)
content = re.sub(
    r"doc\(this\.db, 'vehicles', ([^,]+), 'models', ([^)]+)\)",
    r"this.db.collection('vehicles').doc(\1).collection('models').doc(\2)",
    content
)

# 8. Convert collection(this.db, 'name') -> this.db.collection('name')
for coll in collections + ['vehicles']:
    pattern = rf"collection\(this\.db, '{coll}'\)"
    replacement = rf"this.db.collection('{coll}')"
    content = re.sub(pattern, replacement, content)

# 9. Convert collection(brandDoc.ref, 'models') -> brandDoc.ref.collection('models')
content = re.sub(r"collection\(brandDoc\.ref, 'models'\)", "brandDoc.ref.collection('models')", content)
content = re.sub(r"collection\(modelDoc\.ref, 'trims'\)", "modelDoc.ref.collection('trims')", content)

# 10. Convert await getDoc(ref) -> await ref.get()
content = re.sub(r'await getDoc\(([^)]+)\)', r'await \1.get()', content)

# 11. Convert await getDocs(query) -> await query.get()
content = re.sub(r'await getDocs\(([^)]+)\)', r'await \1.get()', content)

# 12. Convert await setDoc(ref, data) -> await ref.set(data)
# This is tricky because it can span multiple lines
content = re.sub(r'await setDoc\(([^,]+),\s*', r'await \1.set(', content)

# 13. Convert await updateDoc(ref, data) -> await ref.update(data)
content = re.sub(r'await updateDoc\(([^,]+),\s*', r'await \1.update(', content)

# 14. Convert await deleteDoc(ref) -> await ref.delete()
content = re.sub(r'await deleteDoc\(([^)]+)\)', r'await \1.delete()', content)

# 15. Convert query(collection, where...) patterns -> collection.where...
# This is complex, so we'll handle simple cases
# query(reservationsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
# -> reservationsRef.where('userId', '==', userId).orderBy('createdAt', 'desc')

# Handle query() with doc(settingsRef, 'schedule') inside
content = re.sub(
    r"doc\(this\.settingsRef, 'schedule'\)",
    r"this.settingsRef.doc('schedule')",
    content
)
content = re.sub(
    r"doc\(this\.diagnosisReportsRef, reportId\)",
    r"this.diagnosisReportsRef.doc(reportId)",
    content
)
content = re.sub(
    r"doc\(this\.vehicleDiagnosisReportsRef, reportId\)",
    r"this.vehicleDiagnosisReportsRef.doc(reportId)",
    content
)
content = re.sub(
    r"doc\(this\.diagnosisReservationsRef, reservationId\)",
    r"this.diagnosisReservationsRef.doc(reservationId)",
    content
)

# Write the converted content
with open(file_path, 'w') as f:
    f.write(content)

print("Conversion complete. Backup saved as firebaseService.ts.backup2")
print("Please review the changes manually for complex patterns.")
