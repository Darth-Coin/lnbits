import typing

import jinja2
from fastapi import Request, templating
from fastapi.datastructures import QueryParams


class Jinja2Templates(templating.Jinja2Templates):
    def __init__(self, loader: jinja2.BaseLoader) -> None:
        assert jinja2 is not None, "jinja2 must be installed to use Jinja2Templates"
        self.env = self.get_environment(loader)

    def get_environment(self, loader: jinja2.BaseLoader) -> jinja2.Environment:
        @jinja2.pass_context
        def url_for(context: dict, name: str, **path_params: typing.Any) -> str:
            request: Request = context["request"]
            return request.app.url_path_for(name, **path_params)

        def url_params_update(init: QueryParams, **new: typing.Any) -> QueryParams:
            values = dict(init)
            values.update(new)
            return QueryParams(**values)

        env = jinja2.Environment(loader=loader, autoescape=True)
        env.globals["url_for"] = url_for
        env.globals["url_params_update"] = url_params_update
        return env
