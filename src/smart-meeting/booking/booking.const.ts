import { MessageVo } from './vo/message.vo';

export const bookSuccessMessage = (message: MessageVo) =>
    `您的会议室已经预定成功，预定详情:

 会议室: ${message.deskCode}
 日期: ${message.date}
 时间: ${message.startTime}-${message.endTime}
         
         
 请准时前往使用。
        
        
 如需<a href="#">修改信息</a>，请进入预定系统: <a href="#">我的预定</a>中进行操作。距离使用前${message.editTimes}分钟将关闭操作，延时超${message.signTimes}分钟，会议室将自动释放，请注意使用时间。`;

export const signRemindMessage = (message: MessageVo) => {
    return `您预约的会议室将在${message.signBeforeTimes}分钟之后可以使用,预定详情:

 会议室: ${message.deskCode}
 日期: ${message.date}
 时间: ${message.startTime}-${message.endTime}
         
         
 请尽快准时前往签到使用。
        
        
 如需<a href="#">修改信息</a>，请进入预定系统: <a href="#">我的预定</a>中进行操作。距离使用前${message.editTimes}分钟将关闭操作，延时超${message.signTimes}分钟，会议室将自动释放，请注意使用时间。`
}


export const useRemindMessage = (messageDto: MessageVo) =>
    `您预约的会议室现在可以使用,预定详情:

 会议室: ${messageDto.deskCode}
 日期: ${messageDto.date}
 时间: ${messageDto.startTime}-${messageDto.endTime}
         
         
 请打开企业微信扫一扫签到使用。
        
        
 如需<a href="#">修改信息</a>，请进入预定系统: <a href="#">我的预定</a>中进行操作。距离使用前${messageDto.editTimes}分钟将关闭操作，延时超${messageDto.signTimes}分钟，会议室将自动释放，请注意使用时间。`


export const useEndRemindMessage = (messageDto: MessageVo) =>
    `您预约的会议室还有${messageDto.useRemainTimes}分钟使用时间,预定详情:

 会议室: ${messageDto.deskCode}
 日期: ${messageDto.date}
 时间: ${messageDto.startTime}-${messageDto.endTime}
         
         
 请注意使用时间。
        
        
 如需<a href="#">修改信息</a>，请进入预定系统: <a href="#">我的预定</a>中进行操作。距离使用前${messageDto.editTimes}分钟将关闭操作，延时超${messageDto.signTimes}分钟，会议室将自动释放，请注意使用时间。`
