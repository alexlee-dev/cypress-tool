import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'

import { isMac } from '../constants'

/**
 * Iterates over an array and calls a function on each element.
 * @param {Array} array Array to iterate over.
 * @param {Function} callback Callback function. Called with currentElement, index, array
 * @returns {Promise}
 */
const asyncForEach = (array, callback) =>
  new Promise(async (resolve, reject) => {
    try {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
      }
      return resolve()
    } catch (e) {
      return reject(e)
    }
  })

/**
 * Checks if a file or directory exists.
 * @param {String} path String to directory/file.
 * @returns {Promise} Resolves to the file stats if it exists, or false otherwise.
 */
const checkIfFileExists = path =>
  new Promise((resolve, reject) =>
    fs.stat(path, (err, stats) => {
      if (err) {
        return resolve(false)
      }
      return resolve(stats)
    })
  )

// TODO - Make more dynamic
/**
 * Deletes a Cypress Cache
 * @param {String} cache Path to cache directory.
 * @param {Array} cachedVersions Array of strings of directory names. ie - ['4.0.1', '4.2.0']
 * @returns {Promise}
 */
const clearCache = (cache, cachedVersions) =>
  new Promise(async (resolve, reject) => {
    try {
      await asyncForEach(cachedVersions, async version => await removeFile(path.join(cache, `/${version}`)))

      resolve()
    } catch (e) {
      return reject(e)
    }
  })

/**
 * Gets the versions that are currently cached.
 * @param {String} cachePath Path to cache directory.
 * @returns {Promise} Resolves to an array of directory names, or an empty array of none exists.
 */
const getCachedVersions = cachePath =>
  new Promise(async (resolve, reject) => {
    try {
      const exists = await checkIfFileExists(cachePath)

      if (exists) {
        fs.readdir(cachePath, (err, files) => {
          if (err) {
            return reject(err)
          }

          return resolve(files)
        })
      } else {
        return resolve([])
      }
    } catch (e) {
      return reject(e)
    }
  })

/**
 * Initializes CypressTool directory.
 * @returns {Promise} Resolvese after directory has been created, or if it's already created.
 */
const initializeDirectory = () =>
  new Promise(async (resolve, reject) => {
    try {
      const dirPath = isMac ? path.join(process.env.HOME, '/CypressTool') : path.join(process.env.TEMP, '/CypressTool')
      const dir = await checkIfFileExists(dirPath)

      if (!dir) {
        // * Create directory
        fs.mkdir(dirPath, err => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      } else {
        return resolve()
      }
    } catch (e) {
      return reject(e)
    }
  })

/**
 * Deletes a directory or file recursively.
 * @param {String} file String to file/directory to be removed.
 * @returns {Promise}
 */
const removeFile = file =>
  new Promise((resolve, reject) =>
    rimraf(file, error => {
      if (error) {
        return reject(error)
      }
      resolve()
    })
  )

// TODO - Make this more dynamic
/**
 * Saves Cypress file.
 * @param {Object} res Response
 * @param {Object} bar ProgressBar object
 * @returns {Promise}
 */
const saveFile = (res, bar) =>
  new Promise((resolve, reject) => {
    const zipPath = path.join(process.env.HOME, '/CypressTool/Cypress.zip')
    const fileStream = fs.createWriteStream(zipPath)
    res.body.pipe(fileStream)
    res.body.on('error', err => reject(err))
    res.body.on('data', chunk => bar.tick(chunk.length))
    fileStream.on('finish', () => resolve())
  })

module.exports = {
  checkIfFileExists,
  clearCache,
  getCachedVersions,
  initializeDirectory,
  removeFile,
  saveFile
}
