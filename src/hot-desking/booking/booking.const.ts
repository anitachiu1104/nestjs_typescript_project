import { MessageVo } from './vo/message.vo';

export const bookSuccessMessage = (message: MessageVo) =>
    `您的工位已经预定成功，预定详情:

 工位: ${message.deskCode}
 日期: ${message.date}
 时间: ${message.startTime}-${message.endTime}
         
         
 请准时前往使用。
        
        
 如需<a href="#">修改信息</a>，请进入预定系统: <a href="#">我的预定</a>中进行操作。距离使用前${message.editTimes}分钟将关闭操作，延时超${message.signTimes}分钟，工位将自动释放，请注意使用时间。`;

export const signRemindMessage = (message: MessageVo) => {
    return `您预约的工位将在${message.signBeforeTimes}分钟之后可以使用,预定详情:

 工位: ${message.deskCode}
 日期: ${message.date}
 时间: ${message.startTime}-${message.endTime}
         
         
 请尽快准时前往签到使用。
        
        
 如需<a href="#">修改信息</a>，请进入预定系统: <a href="#">我的预定</a>中进行操作。距离使用前${message.editTimes}分钟将关闭操作，延时超${message.signTimes}分钟，工位将自动释放，请注意使用时间。`
}


export const useRemindMessage = (messageDto: MessageVo) =>
    `您预约的工位现在可以使用,预定详情:

 工位: ${messageDto.deskCode}
 日期: ${messageDto.date}
 时间: ${messageDto.startTime}-${messageDto.endTime}
         
         
 请打开企业微信扫一扫签到使用。
        
        
 如需<a href="#">修改信息</a>，请进入预定系统: <a href="#">我的预定</a>中进行操作。距离使用前${messageDto.editTimes}分钟将关闭操作，延时超${messageDto.signTimes}分钟，工位将自动释放，请注意使用时间。`


export const useEndRemindMessage = (messageDto: MessageVo) =>
    `您预约的工位还有${messageDto.useRemainTimes}分钟使用时间,预定详情:

 工位: ${messageDto.deskCode}
 日期: ${messageDto.date}
 时间: ${messageDto.startTime}-${messageDto.endTime}
         
         
 请注意使用时间。
        
        
 如需<a href="#">修改信息</a>，请进入预定系统: <a href="#">我的预定</a>中进行操作。距离使用前${messageDto.editTimes}分钟将关闭操作，延时超${messageDto.signTimes}分钟，工位将自动释放，请注意使用时间。`
