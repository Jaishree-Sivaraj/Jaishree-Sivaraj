import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Measures } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Measures.create({ ...body, createdBy: user })
    .then((measures) => measures.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Measures.count(query)
    .then(count => Measures.find(query, select, cursor)
      .populate('createdBy')
      .then((measures) => ({
        count,
        rows: measures.map((measures) => measures.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Measures.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((measures) => measures ? measures.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Measures.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((measures) => measures ? Object.assign(measures, body).save() : null)
    .then((measures) => measures ? measures.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Measures.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((measures) => measures ? measures.remove() : null)
    .then(success(res, 204))
    .catch(next)



export const retrieveMeasureDetails = async (req, res, next) => {
  try {
    const measures = await Measures.aggregate([{
      $match: { status: true }
    }, {
      $project: {
        id: '$_id',
        measureName: '$measureName',
        measureDescription: '$measureDescription',
        _id: 0
      }
    }]);
    if (!measures) {
      return res.status(404).json({
        status: 404,
        message: 'Failed to retrive measures'
      })
    }

    return res.status(200).json({
      status: "200",
      message: "Measures retrieved successfully!",
      count: measures.length,
      rows: measures
    });

  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message ? error.message : 'Failed to retrieve all mesaure details'
    });
  }
}


export const retrieveMeasureById = async (req, res, next) => {
  Measures.findById(req.params.id)
    .then((response) => {
      let data = {
        id: response._id,
        measureName: response.measureName,
        measureDescription: response.measureDescription
      }
      return res.status(200).json({
        status: "200",
        message: "Measure details retrieved successfully!",
        data: data
      })
    })
    .catch((error) => {
      return res.status(500).json({
        status: '500',
        message: error.message ? error.message : 'Failed to retrive the measure details'
      })
    })
}

export const createMeasure = async (req, res, next) => {
  let body = req.body
  Measures.create({ ...body })
    .then((measures) => {
      return res.status(200).json({
        status: "200",
        message: 'Created new measure successfully!',
        data: measures
      })
    })
    .catch((error) => {
      return res.status(500).json({
        status: 500,
        message: error.message ? error.message : 'Failed to create measure'
      })
    })


}

export const updateMeasureById = async (req, res, next) => {
  Measures.updateOne({ _id: req.params.id }, {
    $set: {
      measureName: req.body.measureName,
      measureDescription: req.body.measureDescription
    }
  })
    .then((response) => {
      return res.status(200).json({
        status: "200",
        message: " updated measure details  successfully!",
        data: response
      })

    })
    .catch((error) => {
      return res.status(500).json({
        status: '500',
        message: error.message ? error.message : 'Failed to update the measure details'
      })
    })
}