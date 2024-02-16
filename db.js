const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ records: [] }).write();

function addRecord(record) {
  db.get('records').push(record).write();
}

// function getAllRecords() {
//   return db.get('records').value();
// }

function getRecordById(id) {
  return db.get('records').find({ id }).value();
}

function updateRecordById(id, newData) {
  db.get('records').find({ id }).assign(newData).write();
}

// function deleteRecordById(id) {
//   db.get('records').remove({ id }).write();
// }

module.exports = {
  addRecord,
  // getAllRecords,
  getRecordById,
  updateRecordById,
  // deleteRecordById,
};
