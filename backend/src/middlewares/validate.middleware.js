// middleware de validación de datos que usa zod para verificar que los datos enviados por el 
// cliente cumplan con un esquema definido, antes de llegar al controller

export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        campo: err.path.join('.'),
        mensaje: err.message,
      }));

      return res.status(400).json({
        error: 'Error de validación en los datos enviados',
        detalles: errors,
      });
    }

    req[target] = result.data;
    next();
  };
};