export default async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.statusCode || err.status || 200;
        ctx.body = {
            result: false,
            message: err.message,
            code: err.code || 200
        };
    }
};
