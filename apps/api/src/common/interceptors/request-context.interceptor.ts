import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { RequestContextStore } from "../context/request-context";

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    if (user) {
      return new Observable((subscriber) => {
        RequestContextStore.run(user, () => {
          const subscription = next.handle().subscribe({
            next: (val) => subscriber.next(val),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
          return () => subscription.unsubscribe();
        });
      });
    }
    return next.handle();
  }
}
