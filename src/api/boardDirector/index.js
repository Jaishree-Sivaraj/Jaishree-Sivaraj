import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, update, destroy, retrieveFilteredDataDirector, uploadBoardDirector, getAllBoardDirectors } from './controller'
import { schema } from './model';
import multer from 'multer';
import XLSX from 'xlsx';
export BoardDirector, { schema } from './model'

const router = new Router()
const { companyId, companyName, din, cin, BOSP004, BODR005, dob, joiningDate, cessationDate, memberType } = schema.tree
let name = "", gender = "", company = [], searchValue = [];;


/**
 * @api {post} /boardDirector Create board director
 * @apiName CreateBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam din Board director's din.
 * @apiParam name Board director's name.
 * @apiParam gender Board director's gender.
 * @apiParam companies Board director's companies.
 * @apiSuccess {Object} boardDirector Board director's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board director not found.
 * @apiError 401 master access only.
 */
router.post('/',
  token({ required: true }),
  body({ companyId, companyName, cin, din, name, gender, dob, joiningDate, cessationDate, memberType }),
  create)

/**
 * @api {get} /boardDirector Retrieve board directors
 * @apiName RetrieveBoardDirectors
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of board directors.
 * @apiSuccess {Object[]} rows List of board directors.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 master access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /boardDirector Retrieve board directors
 * @apiName RetrieveBoardDirectors
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of board directors.
 * @apiSuccess {Object[]} rows List of board directors.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 master access only.
 */
router.get('/all-directors',
  token({ required: true }),
  query(),
  getAllBoardDirectors)

/**
 * @api {get} /boardDirector/:id Retrieve board director
 * @apiName RetrieveBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiSuccess {Object} boardDirector Board director's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board director not found.
 * @apiError 401 master access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {put} /boardDirector/:id Update board director
 * @apiName UpdateBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam din Board director's din.
 * @apiParam name Board director's name.
 * @apiParam gender Board director's gender.
 * @apiParam companies Board director's companies.
 * @apiSuccess {Object} boardDirector Board director's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Board director not found.
 * @apiError 401 master access only.
 */
router.put('/:id',
  token({ required: true }),
  body({ din, name, gender }),
  update)

/**
 * @api {delete} /boardDirector/:id Delete board director
 * @apiName DeleteBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Board director not found.
 * @apiError 401 master access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

/**
* @api {get} /boardDirector/:role Retrieve board director
* @apiName RetrieveBoardDirector
* @apiGroup BoardDirector
* @apiPermission user
* @apiParam {String} access_token user access token.
* @apiUse listParams
* @apiSuccess {Number} count Total amount of Board director.
* @apiSuccess {Object[]} rows List of Board director.
* @apiError {Object} 400 Some parameters may contain invalid values.
* @apiError 401 user access only.
*/
router.get('/search/:role',
  token({
    required: true
  }),
  query({
    page: {
      max: Infinity
    },
    limit: {
      max: Infinity
    },
    searchValue
  }),
  retrieveFilteredDataDirector)

var storage = multer.diskStorage({ //multers disk storage settings

  destination: function (req, file, cb) {

    cb(null, __dirname.replace('routes', '') + '/uploads');

  },

  filename: function (req, file, cb) {

    var datetimestamp = Date.now();

    cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])

  }

});

var uploadDatapoints = multer({ //multer settings

  storage: storage,

  fileFilter: function (req, file, callback) { //file filter

    if (['xls', 'xlsx', 'xlsm'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {

      return callback(new Error('Wrong extension type'));

    }

    callback(null, true);

  }

});
/**
 * @api {post} /boardDirector/upload-board-director Create Board director
 * @apiName UploadBoardDirector
 * @apiGroup BoardDirector
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} board director's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 BoardDirector not found.
 * @apiError 401 user access only.
 */

router.post('/upload-board-director',
  token({ required: true }),
  uploadDatapoints.single("file"),
  uploadBoardDirector)


export default router
