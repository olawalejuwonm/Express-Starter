import os from 'os';
import 'dotenv/config';
export default async function dumpAndRotate(uri: string, path: string) {
  // @ts-ignore
  const { MongoTools, MTOptions, MTCommand } = await import('node-mongotools');
  var mt = new MongoTools();
  var mtc = new MTCommand(); // to reuse log methods
  // mongodump
  const dumpResult = await mt
    .mongodump({ uri, path, dropboxToken: process.env.DROPBOX_SECRET_TOKEN})
    .catch(mtc.logError.bind(mtc));


  console.log(mt, mtc, dumpResult);
  if (dumpResult === undefined) {
    // error case
    // process.exit(1);
    console.log('dumpResult is undefined');
    return;
  }
  mtc.logSuccess(dumpResult);

 // backups rotation
  const rotationResult = await mt
    .rotation({ path, rotationWindowsDays: 5, rotationMinCount: 1 })
    .catch(mtc.logError.bind(mtc));
  if (rotationResult === undefined) {
    // error case
    // process.exit(1);
    console.log('rotationResult is undefined');
    return;
  }
  mtc.logSuccess(rotationResult);
}

const uri = process.env.MONGODB_URI;
const path = `backup/${os.hostname()}`;

dumpAndRotate(uri, path);
