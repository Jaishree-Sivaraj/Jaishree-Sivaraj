import { success, notFound, authorOrAdmin } from '../../services/response/'
import { ValidationRules } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  ValidationRules.create({ ...body, createdBy: user })
    .then((validationRules) => validationRules.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  ValidationRules.count(query)
    .then(count => ValidationRules.find(query, select, cursor)
      .populate('createdBy')
      .populate('datapointId')
      .then((validationRules) => ({
        count,
        rows: validationRules.map((validationRules) => validationRules.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  ValidationRules.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .then(notFound(res))
    .then((validationRules) => validationRules ? validationRules.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  ValidationRules.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((validationRules) => validationRules ? Object.assign(validationRules, body).save() : null)
    .then((validationRules) => validationRules ? validationRules.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  ValidationRules.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((validationRules) => validationRules ? validationRules.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const test = async(req,res,next) => {
 console.log("Test Function called..!", req.query);
 for (let id = 0; id < 100000000; id++) {
   if(id == 0){
     console.log(">>>For loop started ", req.query.from ? req.query.from : 'unknown', new Date());
   }
   await testAsyncMethod(10, req.query.from ? req.query.from : 'unknown');
   if (id == 99999999) {
     console.log("<<<For loop completed ",req.query.from ? req.query.from : 'unknown', new Date());     
   }   
 }
 return res.status(200).json({ status: "200", message: "Test case successfully executed..!"});
}
async function testAsyncMethod(count, triggeredBy){
  // for (let index = 0; index < count; index++) {
  //   if (index == 0) {
  //     console.log('***nested for loop started ',triggeredBy, new Date());
  //   }
  //   if(index == 9){
  //     console.log('***nested for loop ended ',triggeredBy, new Date());
  //   }
  // }
  return true;
}