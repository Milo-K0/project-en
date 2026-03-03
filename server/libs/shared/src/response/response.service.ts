import { Injectable } from '@nestjs/common';
const Business = {
  SUCCESS: {
    code: 20000,
    message: '成功',
  },
  ERROR: {
    code: 40000,
    message: '失败',
  },
};

@Injectable()
export class ResponseService {
  success(data: any) {
    return {
      data,
      code: Business.SUCCESS.code,
      message: Business.SUCCESS.message,
    };
  }
  error(data = null, message: string, code: number = Business.ERROR.code) {
    return {
      data,
      code,
      message: message || Business.ERROR.message,
    };
  }
}
