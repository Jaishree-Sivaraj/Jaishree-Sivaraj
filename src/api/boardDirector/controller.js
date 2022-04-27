import {success, notFound} from '../../services/response/';
import {BoardDirector} from '.';

// export const create = ({bodymen: {body}}, res, next) =>
//   BoardDirector.create (body)
//     .then (boardDirector => boardDirector.view (true))
//     .then (success (res, 201))
//     .catch (next);

export const create = async ({bodymen: {body}}, res, next) => {
  let checkDirectorDin = await BoardDirector.find ({din: body.din});
  try {
    if (checkDirectorDin.length > 0) {
      return res.status (402).json ({
        message: 'DIN already exists',
      });
    } else {
      if (body.din != '') {
        await BoardDirector.create ({
          din: body.din,
          name: body.name,
          gender: body.gender,
          companies: body.companies,
        }).then (async boardDirector => {
          return res.status (200).json ({
            message: 'Board Director created successfully',
            status: '200',
            data: boardDirector.view (true),
          });
        });
      }
    }
  } catch (error) {
    return res.status (500).json ({
      message: error.message,
      status: 500,
    });
  }
};

export const index = ({querymen: {query, select, cursor}}, res, next) =>
  BoardDirector.count (query)
    .then (count =>
      BoardDirector.find (query, select, cursor).then (boardDirectors => {
        let directorObjects = [];
        if (boardDirectors.length > 0) {
          boardDirectors.forEach (obj => {
            directorObjects.push ({
              _id: obj._id,
              din: obj.din,
              name: obj.name,
              gender: obj.gender,
              companies: obj.companies,
              createdAt: obj.createdAt,
              updatedAt: obj.updatedAt,
            });
          });
        }
        return directorObjects;
      })
    )
    .then (success (res))
    .catch (next);

export const show = ({params}, res, next) =>
  BoardDirector.findById (params.id)
    .then (notFound (res))
    .then (boardDirector => (boardDirector ? boardDirector.view () : null))
    .then (success (res))
    .catch (next);

export const update = async ({bodymen: {body}, params}, res, next) => {
  let checkDirectorDin = await BoardDirector.find ({din: body.din});
  if (checkDirectorDin.length > 0) {
    checkDirectorDin.forEach (obj => {
      if (obj._id == params.id) {
        BoardDirector.findById (params.id)
          .then (notFound (res))
          .then (
            boardDirector =>
              boardDirector ? Object.assign (boardDirector, body).save () : null
          )
          .then (
            boardDirector => {
              return res.status (200).json ({
                message: 'Board Director Updated successfully',
                status: '200',
                data: boardDirector.view (true),
              });
            }
          )
          .then (success (res))
          .catch (next);
      } else if (obj._id != params.id) {
        return res.status (402).json ({
          message: 'DIN already exists',
        });
      }
    });
  } else {
    BoardDirector.findById (params.id)
      .then (notFound (res))
      .then (
        boardDirector =>
          boardDirector ? Object.assign (boardDirector, body).save () : null
      )
      .then (
        boardDirector => (boardDirector ? boardDirector.view (true) : null)
      )
      .then (success (res))
      .catch (next);
  }
};

export const destroy = ({params}, res, next) =>
  BoardDirector.findById (params.id)
    .then (notFound (res))
    .then (boardDirector => (boardDirector ? boardDirector.remove () : null))
    .then (success (res, 204))
    .catch (next);
