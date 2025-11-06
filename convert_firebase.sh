#!/bin/bash

# Script to convert Firebase JS SDK to Native SDK patterns
FILE="/Users/sungmin/CharzingApp-Expo/src/services/firebaseService.ts"

echo "Converting Firebase JS SDK to Native SDK..."

# Backup original file
cp "$FILE" "$FILE.backup"

# Convert serverTimestamp() calls
sed -i '' 's/serverTimestamp()/firestore.FieldValue.serverTimestamp()/g' "$FILE"

# Convert Timestamp.fromDate() calls
sed -i '' 's/Timestamp\.fromDate(/firestore.Timestamp.fromDate(/g' "$FILE"

# Convert .exists() to .exists (property, not method)
sed -i '' 's/\.exists()/\.exists/g' "$FILE"

# Convert doc(this.db, 'collection', 'docId') patterns
# This is complex, so we'll handle the most common patterns

# Single level: doc(this.db, 'users', uid) -> this.db.collection('users').doc(uid)
sed -i '' "s/doc(this\.db, 'users', \([^)]*\))/this.db.collection('users').doc(\1)/g" "$FILE"
sed -i '' "s/doc(this\.db, 'diagnosisReservations', \([^)]*\))/this.db.collection('diagnosisReservations').doc(\1)/g" "$FILE"
sed -i '' "s/doc(this\.db, 'diagnosisReports', \([^)]*\))/this.db.collection('diagnosisReports').doc(\1)/g" "$FILE"
sed -i '' "s/doc(this\.db, 'vehicleDiagnosisReports', \([^)]*\))/this.db.collection('vehicleDiagnosisReports').doc(\1)/g" "$FILE"
sed -i '' "s/doc(this\.db, 'userVehicles', \([^)]*\))/this.db.collection('userVehicles').doc(\1)/g" "$FILE"
sed -i '' "s/doc(this\.db, 'settings', \([^)]*\))/this.db.collection('settings').doc(\1)/g" "$FILE"

# Convert collection(this.db, 'name') patterns
sed -i '' "s/collection(this\.db, 'diagnosisReservations')/this.db.collection('diagnosisReservations')/g" "$FILE"
sed -i '' "s/collection(this\.db, 'userVehicles')/this.db.collection('userVehicles')/g" "$FILE"
sed -i '' "s/collection(this\.db, 'vehicles')/this.db.collection('vehicles')/g" "$FILE"

# Convert await getDoc(ref) -> await ref.get()
sed -i '' 's/await getDoc(\([^)]*\))/await \1.get()/g' "$FILE"

# Convert await getDocs(query) -> await query.get()
sed -i '' 's/await getDocs(\([^)]*\))/await \1.get()/g' "$FILE"

# Convert await setDoc(ref, data) -> await ref.set(data)
sed -i '' 's/await setDoc(\([^,]*\), \([^)]*\))/await \1.set(\2)/g' "$FILE"

# Convert await updateDoc(ref, data) -> await ref.update(data)
sed -i '' 's/await updateDoc(\([^,]*\), \([^)]*\))/await \1.update(\2)/g' "$FILE"

# Convert await deleteDoc(ref) -> await ref.delete()
sed -i '' 's/await deleteDoc(\([^)]*\))/await \1.delete()/g' "$FILE"

# Convert runTransaction(this.db, async (transaction) => { ... })
# This is too complex for sed, will handle manually

echo "Conversion complete. Backup saved as $FILE.backup"
echo "Please review the changes and fix any remaining complex patterns manually."
