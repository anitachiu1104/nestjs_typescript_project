
import { PATH_METADATA, MODULE_METADATA } from '@nestjs/common/constants'
const { IMPORTS, CONTROLLERS } = MODULE_METADATA;

function resolveController(target, controllers=[]) {
    const imports = Reflect.getMetadata(IMPORTS, target);

    if (imports) {
        imports.forEach(module => {
            controllers.push(...(Reflect.getMetadata(CONTROLLERS, module) ?? []));
        });
    }

    return controllers;
}

export function SetModulePrefix(prefix: string) {
    return target => {
        resolveController(target).forEach(controller =>  {
            const path = Reflect.getMetadata(PATH_METADATA, controller);
            if (path) {
                Reflect.defineMetadata(PATH_METADATA, prefix + path, controller);
            }
        });
    };
}